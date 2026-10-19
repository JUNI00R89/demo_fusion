import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  ClipboardList, Search, ScanLine, Check, AlertTriangle, Package,
  TrendingUp, TrendingDown, Minus, Save, RotateCcw
} from 'lucide-react';
import { mockProducts, type Product } from '../../utils/mockData';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { toast } from 'sonner';

interface CountEntry {
  product: Product;
  sistemaCantidad: number;
  contadaCantidad: number | null;
  ajustado: boolean;
}

export function PhysicalCount() {
  const [entries, setEntries] = useState<CountEntry[]>(() =>
    mockProducts.map(p => ({ product: p, sistemaCantidad: p.stock, contadaCantidad: null, ajustado: false }))
  );
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [filterDiff, setFilterDiff] = useState<'todos' | 'diferencias' | 'pendientes'>('todos');
  const [sessionStarted, setSessionStarted] = useState(false);

  const filtered = entries.filter(e => {
    const matchSearch = e.product.name.toLowerCase().includes(search.toLowerCase()) ||
      e.product.sku.toLowerCase().includes(search.toLowerCase());
    if (filterDiff === 'diferencias') {
      return matchSearch && e.contadaCantidad !== null && e.contadaCantidad !== e.sistemaCantidad;
    }
    if (filterDiff === 'pendientes') {
      return matchSearch && e.contadaCantidad === null;
    }
    return matchSearch;
  });

  const updateContada = (productId: string, value: string) => {
    const num = value === '' ? null : parseInt(value);
    setEntries(prev => prev.map(e =>
      e.product.id === productId ? { ...e, contadaCantidad: num, ajustado: false } : e
    ));
  };

  const adjustEntry = (productId: string) => {
    setEntries(prev => prev.map(e =>
      e.product.id === productId ? { ...e, ajustado: true } : e
    ));
    const entry = entries.find(e => e.product.id === productId);
    if (entry && entry.contadaCantidad !== null) {
      const diff = entry.contadaCantidad - entry.sistemaCantidad;
      toast.success(`${entry.product.name} ajustado`, {
        description: `${diff >= 0 ? '+' : ''}${diff} unidades`,
        duration: 2000,
      });
    }
  };

  const adjustAll = () => {
    const withDiff = entries.filter(e => e.contadaCantidad !== null && e.contadaCantidad !== e.sistemaCantidad && !e.ajustado);
    setEntries(prev => prev.map(e =>
      e.contadaCantidad !== null && !e.ajustado ? { ...e, ajustado: true } : e
    ));
    toast.success(`${withDiff.length} productos ajustados`, { description: 'Inventario actualizado' });
  };

  const getDiff = (e: CountEntry) => {
    if (e.contadaCantidad === null) return null;
    return e.contadaCantidad - e.sistemaCantidad;
  };

  const contadas = entries.filter(e => e.contadaCantidad !== null).length;
  const conDiferencias = entries.filter(e => {
    const d = getDiff(e);
    return d !== null && d !== 0;
  }).length;
  const pendientes = entries.filter(e => e.contadaCantidad === null).length;

  return (
    <Layout>
      {showScanner && (
        <BarcodeScanner
          context="count"
          mode="single"
          onScan={(code, product) => {
            if (product) {
              toast.info(`Producto encontrado: ${product.name}`, { description: 'Ingresa la cantidad contada' });
            }
          }}
          onCount={product => {
            setEntries(prev => prev.map(e =>
              e.product.id === product.id ? { ...e, contadaCantidad: e.sistemaCantidad } : e
            ));
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="text-orange-500" size={24} /> Conteo Físico
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sessionStarted
                ? `${contadas}/${entries.length} productos contados`
                : 'Inicia una sesión de conteo'}
            </p>
          </div>
          {!sessionStarted ? (
            <Button onClick={() => setSessionStarted(true)} className="bg-orange-500 hover:bg-orange-600 text-white self-start sm:self-auto">
              <ClipboardList size={18} className="mr-2" /> Iniciar conteo
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowScanner(true)} className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30">
                <ScanLine size={16} className="mr-1.5" /> Escanear
              </Button>
              <Button size="sm" onClick={adjustAll} className="bg-green-600 hover:bg-green-700 text-white">
                <Save size={16} className="mr-1.5" /> Ajustar todo
              </Button>
            </div>
          )}
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 border border-border text-center cursor-pointer hover:shadow-sm" onClick={() => setFilterDiff('todos')}>
            <p className="text-2xl font-bold text-foreground">{contadas}</p>
            <p className="text-xs text-muted-foreground">Contados</p>
          </Card>
          <Card className={`p-4 border text-center cursor-pointer hover:shadow-sm ${conDiferencias > 0 ? 'border-red-300 dark:border-red-800' : 'border-border'}`} onClick={() => setFilterDiff('diferencias')}>
            <p className={`text-2xl font-bold ${conDiferencias > 0 ? 'text-red-600' : 'text-foreground'}`}>{conDiferencias}</p>
            <p className="text-xs text-muted-foreground">Diferencias</p>
          </Card>
          <Card className="p-4 border border-border text-center cursor-pointer hover:shadow-sm" onClick={() => setFilterDiff('pendientes')}>
            <p className="text-2xl font-bold text-amber-600">{pendientes}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {([
            { id: 'todos', label: 'Todos' },
            { id: 'diferencias', label: 'Con diferencias' },
            { id: 'pendientes', label: 'Sin contar' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilterDiff(f.id)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterDiff === f.id ? 'bg-orange-500 text-white' : 'bg-accent text-muted-foreground hover:bg-orange-50 dark:hover:bg-orange-950/30'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Buscar producto o SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>

        {/* Count table */}
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Producto</th>
                  <th className="text-center px-3 py-3 font-semibold text-foreground w-24">Sistema</th>
                  <th className="text-center px-3 py-3 font-semibold text-foreground w-28">Contada</th>
                  <th className="text-center px-3 py-3 font-semibold text-foreground w-20">Diff.</th>
                  <th className="text-center px-3 py-3 font-semibold text-foreground w-24">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Package size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay productos</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry, i) => {
                    const diff = getDiff(entry);
                    const hasDiff = diff !== null && diff !== 0;
                    const isAdjusted = entry.ajustado;

                    return (
                      <tr key={entry.product.id} className={`border-b border-border/40 ${i % 2 === 0 ? '' : 'bg-muted/10'} ${hasDiff && !isAdjusted ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground text-sm">{entry.product.name}</p>
                            <p className="text-[10px] text-muted-foreground">{entry.product.sku} · {entry.product.category}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-semibold text-foreground">{entry.sistemaCantidad}</td>
                        <td className="px-3 py-3 text-center">
                          {sessionStarted ? (
                            <Input
                              type="number"
                              min={0}
                              value={entry.contadaCantidad ?? ''}
                              onChange={e => updateContada(entry.product.id, e.target.value)}
                              className={`w-20 h-8 text-center text-sm mx-auto ${isAdjusted ? 'opacity-60 cursor-not-allowed' : ''} ${hasDiff && !isAdjusted ? 'border-red-400 focus:ring-red-500' : ''}`}
                              disabled={isAdjusted}
                              placeholder="—"
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {diff === null ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : diff === 0 ? (
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <Check size={14} />
                              <span className="text-xs font-semibold">OK</span>
                            </div>
                          ) : (
                            <div className={`flex items-center justify-center gap-1 ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {diff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              <span className="text-xs font-bold font-mono">{diff > 0 ? '+' : ''}{diff}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isAdjusted ? (
                            <Badge className="bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] border-0">Ajustado</Badge>
                          ) : hasDiff && sessionStarted ? (
                            <Button size="sm" onClick={() => adjustEntry(entry.product.id)} className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white px-2">
                              Ajustar
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {sessionStarted && conDiferencias > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{conDiferencias} diferencias encontradas</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Revisa y ajusta las cantidades antes de cerrar el conteo</p>
            </div>
            <Button size="sm" onClick={adjustAll} className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0">
              Ajustar todo
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
