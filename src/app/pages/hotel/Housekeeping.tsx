import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Building2, CheckCircle2, Clock, AlertTriangle, User, RefreshCw } from 'lucide-react';
import { mockHabitaciones, type Habitacion } from '../../utils/mockData';
import { toast } from 'sonner';

type EstadoLimpieza = Habitacion['estadoLimpieza'];

const LIMPIEZA_CONFIG: Record<EstadoLimpieza, { label: string; color: string; bg: string; icon: React.ElementType; next: EstadoLimpieza | null }> = {
  sucia:         { label: 'Sucia',         color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',    icon: AlertTriangle, next: 'en_limpieza' },
  en_limpieza:   { label: 'En limpieza',   color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',   icon: Clock,         next: 'lista' },
  lista:         { label: 'Lista',         color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', icon: CheckCircle2,  next: 'inspeccionada' },
  inspeccionada: { label: 'Inspeccionada', color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800', icon: CheckCircle2,  next: null },
};

const PERSONAL = ['Ana García', 'Pedro López', 'María Torres', 'Juan Soto'];

export function Housekeeping() {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>(mockHabitaciones);
  const [filterPiso, setFilterPiso] = useState<number | 'todos'>('todos');
  const [filterEstado, setFilterEstado] = useState<EstadoLimpieza | 'todos'>('todos');
  const [asignaciones, setAsignaciones] = useState<Record<string, string>>({});

  const pisos = Array.from(new Set(mockHabitaciones.map(h => h.piso))).sort();

  const filtered = habitaciones.filter(h => {
    const matchPiso = filterPiso === 'todos' || h.piso === filterPiso;
    const matchEstado = filterEstado === 'todos' || h.estadoLimpieza === filterEstado;
    return matchPiso && matchEstado;
  });

  const advanceState = (id: string) => {
    setHabitaciones(prev => prev.map(h => {
      if (h.id !== id) return h;
      const next = LIMPIEZA_CONFIG[h.estadoLimpieza].next;
      if (!next) return h;
      const cfg = LIMPIEZA_CONFIG[next];
      toast.success(`Hab. ${h.numero} → ${cfg.label}`);
      return { ...h, estadoLimpieza: next };
    }));
  };

  const asignar = (id: string, personal: string) => {
    setAsignaciones(prev => ({ ...prev, [id]: personal }));
    const hab = habitaciones.find(h => h.id === id);
    toast.success(`Hab. ${hab?.numero} asignada a ${personal}`);
    if (hab?.estadoLimpieza === 'sucia') advanceState(id);
  };

  const counts: Record<EstadoLimpieza, number> = {
    sucia: habitaciones.filter(h => h.estadoLimpieza === 'sucia').length,
    en_limpieza: habitaciones.filter(h => h.estadoLimpieza === 'en_limpieza').length,
    lista: habitaciones.filter(h => h.estadoLimpieza === 'lista').length,
    inspeccionada: habitaciones.filter(h => h.estadoLimpieza === 'inspeccionada').length,
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="text-orange-500" size={24} /> Tablero de Limpieza
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Estado de habitaciones por piso</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setHabitaciones(mockHabitaciones)} className="self-start sm:self-auto">
            <RefreshCw size={16} className="mr-1.5" /> Actualizar
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(LIMPIEZA_CONFIG) as [EstadoLimpieza, typeof LIMPIEZA_CONFIG[EstadoLimpieza]][]).map(([estado, cfg]) => {
            const Icon = cfg.icon;
            return (
              <Card
                key={estado}
                className={`p-4 border cursor-pointer hover:shadow-sm transition-shadow ${filterEstado === estado ? 'ring-2 ring-orange-500' : 'border-border'}`}
                onClick={() => setFilterEstado(filterEstado === estado ? 'todos' : estado)}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} className={cfg.color} />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{counts[estado]}</p>
                    <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterPiso('todos')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterPiso === 'todos' ? 'bg-orange-500 text-white' : 'bg-accent text-muted-foreground hover:bg-orange-50 dark:hover:bg-orange-950/30'}`}>
            Todos los pisos
          </button>
          {pisos.map(piso => (
            <button key={piso} onClick={() => setFilterPiso(piso)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterPiso === piso ? 'bg-orange-500 text-white' : 'bg-accent text-muted-foreground hover:bg-orange-50 dark:hover:bg-orange-950/30'}`}>
              Piso {piso}
            </button>
          ))}
        </div>

        {/* Grid by floor */}
        {(filterPiso === 'todos' ? pisos : [filterPiso as number]).map(piso => {
          const habitsPiso = filtered.filter(h => h.piso === piso);
          if (habitsPiso.length === 0) return null;
          return (
            <div key={piso}>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Building2 size={14} className="text-orange-500" /> Piso {piso}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {habitsPiso.map(hab => {
                  const cfg = LIMPIEZA_CONFIG[hab.estadoLimpieza];
                  const Icon = cfg.icon;
                  const personal = asignaciones[hab.id];

                  return (
                    <Card key={hab.id} className={`p-4 border ${cfg.bg}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-foreground text-base">Hab. {hab.numero}</p>
                          <p className="text-xs text-muted-foreground capitalize">{hab.tipo} · {hab.capacidad} personas</p>
                        </div>
                        <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs flex items-center gap-1`}>
                          <Icon size={10} /> {cfg.label}
                        </Badge>
                      </div>

                      {personal && (
                        <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                          <User size={12} />
                          <span>{personal}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {cfg.next && (
                          <Button size="sm" onClick={() => advanceState(hab.id)} className="flex-1 h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white">
                            <Icon size={12} className="mr-1" /> {LIMPIEZA_CONFIG[cfg.next].label}
                          </Button>
                        )}
                        {hab.estadoLimpieza === 'sucia' && !personal && (
                          <select
                            onChange={e => e.target.value && asignar(hab.id, e.target.value)}
                            defaultValue=""
                            className="flex-1 h-8 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Asignar...</option>
                            {PERSONAL.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        )}
                        {hab.estadoLimpieza === 'inspeccionada' && (
                          <div className="flex-1 flex items-center justify-center gap-1 text-green-600 text-xs font-semibold">
                            <CheckCircle2 size={14} /> Lista para huésped
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
