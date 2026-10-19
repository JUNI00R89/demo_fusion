import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeftRight, Plus, Search, Truck, Package, CheckCircle2,
  Clock, AlertCircle, X, ChevronRight, Barcode, ScanLine
} from 'lucide-react';
import { mockTraslados, mockSucursales, mockProducts, type Traslado } from '../../utils/mockData';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { toast } from 'sonner';

const ESTADO_CONFIG = {
  pendiente:   { label: 'Pendiente',     color: 'text-amber-600',  bg: 'bg-amber-100 dark:bg-amber-950/40',  icon: Clock },
  en_transito: { label: 'En tránsito',   color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-950/40',    icon: Truck },
  recibido:    { label: 'Recibido',      color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-950/40',  icon: CheckCircle2 },
};

export function Transfers() {
  const [traslados, setTraslados] = useState<Traslado[]>(mockTraslados);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<Traslado['estado'] | 'todos'>('todos');
  const [showNew, setShowNew] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedTraslado, setSelectedTraslado] = useState<Traslado | null>(null);
  const [newTraslado, setNewTraslado] = useState({
    origen: mockSucursales[0].id,
    destino: mockSucursales[1].id,
    notas: '',
    items: [] as { productoId: string; nombre: string; cantidad: number }[],
  });
  const [addProductId, setAddProductId] = useState('');
  const [addQty, setAddQty] = useState(1);

  const filtered = traslados.filter(t => {
    const orig = mockSucursales.find(s => s.id === t.origen)?.nombre || '';
    const dest = mockSucursales.find(s => s.id === t.destino)?.nombre || '';
    const matchSearch = orig.toLowerCase().includes(search.toLowerCase()) ||
      dest.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'todos' || t.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const handleAdvance = (trasladoId: string) => {
    setTraslados(prev => prev.map(t => {
      if (t.id !== trasladoId) return t;
      if (t.estado === 'pendiente') {
        toast.success('Traslado enviado', { description: `${t.id} → en tránsito` });
        return { ...t, estado: 'en_transito', fechaEnvio: new Date().toISOString() };
      }
      if (t.estado === 'en_transito') {
        toast.success('Traslado recibido', { description: `${t.id} completado` });
        return { ...t, estado: 'recibido', fechaRecepcion: new Date().toISOString() };
      }
      return t;
    }));
    setSelectedTraslado(null);
  };

  const handleAddItem = () => {
    const product = mockProducts.find(p => p.id === addProductId);
    if (!product) { toast.error('Selecciona un producto'); return; }
    if (addQty < 1) { toast.error('Cantidad inválida'); return; }
    const exists = newTraslado.items.find(i => i.productoId === product.id);
    if (exists) {
      setNewTraslado(n => ({ ...n, items: n.items.map(i => i.productoId === product.id ? { ...i, cantidad: i.cantidad + addQty } : i) }));
    } else {
      setNewTraslado(n => ({ ...n, items: [...n.items, { productoId: product.id, nombre: product.name, cantidad: addQty }] }));
    }
    setAddProductId('');
    setAddQty(1);
  };

  const handleCreateTraslado = () => {
    if (newTraslado.origen === newTraslado.destino) { toast.error('El origen y destino deben ser distintos'); return; }
    if (newTraslado.items.length === 0) { toast.error('Agrega al menos un producto'); return; }
    const id = `T${String(Date.now()).slice(-3)}`;
    const nuevo: Traslado = { id, ...newTraslado, estado: 'pendiente', fechaCreacion: new Date().toISOString() };
    setTraslados(prev => [nuevo, ...prev]);
    toast.success('Traslado creado', { description: `${id} → Pendiente de envío` });
    setShowNew(false);
    setNewTraslado({ origen: mockSucursales[0].id, destino: mockSucursales[1].id, notas: '', items: [] });
  };

  const counts = {
    pendiente: traslados.filter(t => t.estado === 'pendiente').length,
    en_transito: traslados.filter(t => t.estado === 'en_transito').length,
    recibido: traslados.filter(t => t.estado === 'recibido').length,
  };

  return (
    <Layout>
      {showScanner && (
        <BarcodeScanner
          context="receive"
          mode="single"
          onScan={(code, product) => {
            if (product) {
              setNewTraslado(n => ({
                ...n,
                items: n.items.find(i => i.productoId === product.id)
                  ? n.items.map(i => i.productoId === product.id ? { ...i, cantidad: i.cantidad + 1 } : i)
                  : [...n.items, { productoId: product.id, nombre: product.name, cantidad: 1 }]
              }));
              toast.success(`${product.name} agregado al traslado`);
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ArrowLeftRight className="text-orange-500" size={24} /> Traslados de Inventario
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Movimientos entre sucursales y bodegas</p>
          </div>
          <Button onClick={() => setShowNew(v => !v)} className="bg-orange-500 hover:bg-orange-600 text-white self-start sm:self-auto">
            <Plus size={18} className="mr-2" /> Nuevo traslado
          </Button>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(ESTADO_CONFIG) as Traslado['estado'][]).map(estado => {
            const cfg = ESTADO_CONFIG[estado];
            const Icon = cfg.icon;
            return (
              <Card key={estado} className={`p-4 border border-border cursor-pointer hover:shadow-sm transition-shadow ${filterEstado === estado ? 'ring-2 ring-orange-500' : ''}`} onClick={() => setFilterEstado(filterEstado === estado ? 'todos' : estado)}>
                <div className="flex items-center gap-2">
                  <Icon size={16} className={cfg.color} />
                  <div>
                    <p className="text-xl font-bold text-foreground">{counts[estado]}</p>
                    <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* New traslado form */}
        {showNew && (
          <Card className="p-5 border border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-orange-500" /> Nuevo Traslado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Origen</label>
                <select value={newTraslado.origen} onChange={e => setNewTraslado(n => ({ ...n, origen: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {mockSucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Destino</label>
                <select value={newTraslado.destino} onChange={e => setNewTraslado(n => ({ ...n, destino: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {mockSucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            </div>

            {/* Add products */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">Productos a trasladar</label>
                <Button variant="outline" size="sm" onClick={() => setShowScanner(true)} className="h-7 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30">
                  <ScanLine size={12} className="mr-1" /> Escanear
                </Button>
              </div>
              <div className="flex gap-2 mb-3">
                <select value={addProductId} onChange={e => setAddProductId(e.target.value)} className="flex-1 h-9 px-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Selecciona producto...</option>
                  {mockProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
                <Input type="number" value={addQty} onChange={e => setAddQty(parseInt(e.target.value) || 1)} className="w-20 h-9 text-center" min={1} />
                <Button size="sm" onClick={handleAddItem} className="h-9 bg-orange-500 hover:bg-orange-600 text-white px-3"><Plus size={14} /></Button>
              </div>
              {newTraslado.items.length > 0 ? (
                <div className="space-y-1.5">
                  {newTraslado.items.map(item => (
                    <div key={item.productoId} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border text-sm">
                      <Package size={14} className="text-orange-500 flex-shrink-0" />
                      <span className="flex-1 text-foreground truncate">{item.nombre}</span>
                      <span className="font-bold text-foreground">×{item.cantidad}</span>
                      <button onClick={() => setNewTraslado(n => ({ ...n, items: n.items.filter(i => i.productoId !== item.productoId) }))} className="text-red-400 hover:text-red-600 ml-1"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">Sin productos. Agrega o escanea.</p>
              )}
            </div>

            <Input placeholder="Notas (opcional)" value={newTraslado.notas} onChange={e => setNewTraslado(n => ({ ...n, notas: e.target.value }))} className="h-9" />

            <div className="flex gap-2">
              <Button onClick={handleCreateTraslado} className="bg-orange-500 hover:bg-orange-600 text-white">Crear traslado</Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Buscar traslados..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>

        {/* Traslados list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <ArrowLeftRight size={40} className="mx-auto mb-2 opacity-30" />
              <p>No hay traslados</p>
            </div>
          ) : (
            filtered.map(t => {
              const cfg = ESTADO_CONFIG[t.estado];
              const Icon = cfg.icon;
              const origen = mockSucursales.find(s => s.id === t.origen);
              const destino = mockSucursales.find(s => s.id === t.destino);
              return (
                <Card key={t.id} className="p-4 border border-border hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedTraslado(t)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground font-mono">{t.id}</span>
                        <Badge className={`text-[10px] h-4 px-1.5 ${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <span>{origen?.nombre}</span>
                        <ChevronRight size={12} />
                        <span>{destino?.nombre}</span>
                      </div>
                      <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{t.items.length} producto{t.items.length !== 1 ? 's' : ''}</span>
                        <span>{new Date(t.fechaCreacion).toLocaleDateString('es-MX')}</span>
                        {t.notas && <span className="italic truncate">{t.notas}</span>}
                      </div>
                    </div>
                    {t.estado !== 'recibido' && (
                      <Button size="sm" onClick={e => { e.stopPropagation(); handleAdvance(t.id); }} className={`flex-shrink-0 h-8 text-xs ${t.estado === 'pendiente' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                        {t.estado === 'pendiente' ? 'Enviar' : 'Recibir'}
                      </Button>
                    )}
                  </div>
                  {/* Items preview */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.items.slice(0, 3).map(item => (
                      <span key={item.productoId} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                        {item.nombre.split(' ').slice(0, 2).join(' ')} ×{item.cantidad}
                      </span>
                    ))}
                    {t.items.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">+{t.items.length - 3} más</span>}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
