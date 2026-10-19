import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, ArrowDownRight, ArrowUpRight, Boxes, ChefHat, CircleDollarSign, Package, Plus, ShoppingCart, Truck, Utensils, Wallet, AlertTriangle, Clock3, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBusiness, type BusinessConfig } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { colombiaDateKey, dataService, getBusinessTypeTransitions, restoreBusinessTypeTransition, type BusinessTypeTransitionRecord, type SaleRecord } from '../services/dataService';
import type { Product } from '../utils/mockData';
import { SupportCenter } from '../components/SupportCenter';
import { AnimatedCounter } from '../components/motion/AnimatedCounter';

const money = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function Dashboard() {
  const navigate = useNavigate(); const { config, setConfig } = useBusiness(); const { user } = useAuth();
  const foodMenuEnabled = config?.type === 'restaurant' && (config.foodConfig?.activeModules ?? []).includes('menu');
  const ordersEnabled = config?.type === 'restaurant' && (config.foodConfig?.activeModules ?? []).includes('pedidos');
  const inventoryEnabled = Boolean(config?.features.inventory);
  const posEnabled = Boolean(config?.features.pos);
  const productManagementEnabled = inventoryEnabled || foodMenuEnabled;
  const catalogEnabled = productManagementEnabled || posEnabled;
  const isCustomRole = Boolean(user?.customRoleId);
  const permissions = user?.permissions ?? [];
  const canReadCatalog = !isCustomRole || permissions.includes('catalog.view');
  const canReadSales = !isCustomRole || permissions.includes('sales.view');
  const canCreateSales = isCustomRole ? permissions.includes('sales.create') : ['owner', 'business_admin', 'cashier'].includes(user?.role ?? '');
  const canCreateCatalog = isCustomRole ? permissions.includes('catalog.create') : user?.role === 'owner' || user?.role === 'business_admin';
  const canReadReports = isCustomRole ? permissions.includes('reports.view') : user?.role === 'owner' || user?.role === 'business_admin';
  const canReadSuppliers = isCustomRole ? permissions.includes('suppliers.view') : user?.role === 'owner' || user?.role === 'business_admin';
  const canReadOrders = isCustomRole ? permissions.some(permission => ['orders.view', 'orders.manage'].includes(permission)) : ['owner', 'business_admin', 'cashier'].includes(user?.role ?? '');
  const [products, setProducts] = useState<Product[]>([]); const [sales, setSales] = useState<SaleRecord[]>([]); const [loading, setLoading] = useState(true);
  const [pendingTransitions, setPendingTransitions] = useState<BusinessTypeTransitionRecord[]>([]);
  const [restoringTransition, setRestoringTransition] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const productRequest = catalogEnabled && canReadCatalog ? dataService.getProducts() : Promise.resolve([] as Product[]);
    const salesRequest = posEnabled && canReadSales ? dataService.getSales() : Promise.resolve([] as SaleRecord[]);
    void Promise.all([productRequest, salesRequest]).then(([p, s]) => { if (active) { setProducts(p); setSales(s); } }).catch(error => toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los indicadores.')).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [catalogEnabled, posEnabled, canReadCatalog, canReadSales]);

  useEffect(() => {
    let active = true;
    if (user?.role !== 'owner') { setPendingTransitions([]); return; }
    getBusinessTypeTransitions().then(rows => { if (active) setPendingTransitions(rows); }).catch(() => { if (active) setPendingTransitions([]); });
    return () => { active = false; };
  }, [user?.id, user?.role, config?.type]);

  const revertBusinessType = async (transition: BusinessTypeTransitionRecord) => {
    setRestoringTransition(transition.id);
    try {
      const result = await restoreBusinessTypeTransition(transition.id);
      await setConfig(result.config as BusinessConfig);
      setPendingTransitions(previous => previous.filter(item => item.id !== transition.id));
      toast.success('Se recuperó la configuración del tipo de negocio anterior.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo recuperar el tipo de negocio anterior.');
    } finally { setRestoringTransition(null); }
  };
  const completed = sales.filter(s => s.status === 'completed');
  const today = colombiaDateKey();
  const todaySales = completed.filter(s => s.date.slice(0, 10) === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalPrice, 0);
  const avgTicket = todaySales.length ? todayRevenue / todaySales.length : 0;
  const lowStock = inventoryEnabled ? products.filter(p => p.stock <= p.minStock) : [];
  const chartData = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    const key = colombiaDateKey(date);
    const daySales = completed.filter(s => s.date.slice(0, 10) === key);
    return { day: `${days[date.getDay()]} ${date.getDate()}`, ventas: daySales.length, ingresos: daySales.reduce((sum, s) => sum + s.totalPrice, 0) };
  }), [completed]);
  const quickActions = isCustomRole
    ? [
        ...(posEnabled && canCreateSales ? [{ label: 'Punto de venta', description: 'Registrar una venta', icon: ShoppingCart, path: '/pos' }] : []),
        ...(posEnabled && canReadSales ? [{ label: 'Consultar ventas', description: 'Revisar las transacciones autorizadas', icon: Wallet, path: '/sales' }] : []),
        ...(canReadCatalog && productManagementEnabled ? [{ label: foodMenuEnabled ? 'Ver menú' : 'Ver productos', description: 'Consultar el catálogo', icon: Package, path: '/products' }] : []),
        ...(canCreateCatalog && productManagementEnabled ? [{ label: foodMenuEnabled ? 'Editar menú' : 'Nuevo producto', description: 'Administrar el catálogo autorizado', icon: Plus, path: '/products/new' }] : []),
        ...(ordersEnabled && canReadOrders ? [{ label: 'Pedidos / Preparación', description: 'Consultar pedidos habilitados', icon: ChefHat, path: '/restaurant/kitchen' }] : []),
        ...(canReadSuppliers && inventoryEnabled ? [{ label: 'Proveedores', description: 'Consultar proveedores', icon: Truck, path: '/suppliers' }] : []),
        ...(canReadReports ? [{ label: 'Reportes', description: 'Consultar los reportes autorizados', icon: Activity, path: '/reports' }] : []),
      ]
    : user?.role === 'cashier'
      ? (posEnabled ? [
          { label: 'Punto de venta', description: 'Registrar una venta en tu turno', icon: ShoppingCart, path: '/pos' },
          { label: 'Mis ventas', description: 'Consultar tus transacciones', icon: Wallet, path: '/sales' },
        ] : [])
      : [
          ...(posEnabled ? [{ label: 'Punto de venta', description: 'Cobrar una venta', icon: ShoppingCart, path: '/pos' }] : []),
          ...(ordersEnabled ? [{ label: 'Pedidos / Preparación', description: 'Gestionar las comandas', icon: ChefHat, path: '/restaurant/kitchen' }] : []),
          ...(productManagementEnabled ? [{ label: foodMenuEnabled ? 'Editar menú' : 'Nuevo producto', description: foodMenuEnabled ? 'Administrar productos de comida' : 'Registrar en el catálogo', icon: Plus, path: '/products/new' }] : []),
          ...(inventoryEnabled ? [{ label: 'Proveedores', description: 'Gestionar abastecimiento', icon: Truck, path: '/suppliers' }] : []),
          ...(canReadReports ? [{ label: 'Reportes', description: 'Consultar resultados del negocio', icon: Activity, path: '/reports' }] : []),
        ];

  const typeLabel = (type: string) => ({ retail: 'Tienda / Retail', restaurant: 'Negocio de comidas', food: 'Negocio de comidas', hotel: 'Hotel / Hospedaje', warehouse: 'Bodega / Distribuidora', services: 'Servicios' } as Record<string, string>)[type] || type;

  return <Layout><div className="mx-auto max-w-7xl space-y-6">
    {pendingTransitions.map(transition => <Card key={transition.id} className="border-amber-300 bg-amber-50/80 p-5 shadow-sm dark:border-amber-900 dark:bg-amber-950/20"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"><Clock3 className="h-5 w-5"/></span><div><h2 className="font-semibold text-amber-950 dark:text-amber-100">Cambio de tipo de negocio en periodo de recuperación</h2><p className="mt-1 text-sm leading-6 text-amber-900/90 dark:text-amber-100/80">Cambiaste de <strong>{typeLabel(transition.oldType)}</strong> a <strong>{typeLabel(transition.newType)}</strong>. Los datos específicos del módulo anterior se conservan temporalmente. Los productos, ventas, usuarios y registros comunes no se eliminan por este cambio.</p><p className="mt-2 text-xs text-amber-900/80 dark:text-amber-100/70">La recuperación está disponible hasta: <strong>{new Date(transition.expiresAt).toLocaleString('es-CO')}</strong></p>{transition.pendingModules.length > 0 && <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/70">Módulos en transición: {transition.pendingModules.join(', ')}.</p>}</div></div><Button type="button" variant="outline" disabled={restoringTransition === transition.id} onClick={() => void revertBusinessType(transition)} className="shrink-0 border-amber-400 bg-white text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-card dark:text-amber-100 dark:hover:bg-amber-900/40"><RotateCcw className="mr-2 h-4 w-4"/>{restoringTransition === transition.id ? 'Recuperando…' : 'Recuperar tipo anterior'}</Button></div></Card>)}
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-orange-600">Panel de control</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Hola, bienvenido</h1><p className="mt-1 text-muted-foreground">{config?.name || 'Tu negocio'} · Resumen operativo basado en los registros guardados.</p></div><div className="flex flex-wrap gap-2">{productManagementEnabled && canReadCatalog && <Button variant="outline" onClick={() => navigate('/products')} className="rounded-xl"><Boxes className="mr-2 h-4 w-4"/>{inventoryEnabled ? 'Ver inventario' : 'Ver menú'}</Button>}{posEnabled && canCreateSales && <Button onClick={() => navigate('/pos')} className="rounded-xl bg-orange-600 text-white hover:bg-orange-700"><ShoppingCart className="mr-2 h-4 w-4"/>Abrir caja</Button>}</div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card className="rounded-2xl border-border/70 p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{posEnabled ? 'Ingresos de hoy' : 'Ventas'}</span><div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><CircleDollarSign className="h-5 w-5"/></div></div><p className="mt-4 text-2xl font-bold tracking-tight">{loading ? '—' : !canReadSales && posEnabled ? 'Restringido' : posEnabled ? <AnimatedCounter value={todayRevenue} format={money} /> : 'Desactivado'}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">{posEnabled && !canReadSales ? 'Tu rol no permite consultar las ventas' : posEnabled ? <><ArrowUpRight className="h-3.5 w-3.5 text-emerald-600"/>{todaySales.length} ventas completadas</> : 'Activa Caja / Ventas en la configuración'}</p></Card><Card className="rounded-2xl border-border/70 p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{posEnabled ? 'Ventas de hoy' : 'Productos activos'}</span><div className="rounded-xl bg-orange-50 p-2 text-orange-700"><ShoppingCart className="h-5 w-5"/></div></div><p className="mt-4 text-2xl font-bold tracking-tight">{loading ? '—' : posEnabled ? (!canReadSales ? 'Restringido' : <AnimatedCounter value={todaySales.length} />) : (!canReadCatalog ? 'Restringido' : <AnimatedCounter value={products.length} />)}</p><p className="mt-1 text-xs text-muted-foreground">{posEnabled ? (!canReadSales ? 'Tu rol no permite consultar las ventas' : 'Operaciones con estado completado') : (!canReadCatalog ? 'Tu rol no permite consultar el catálogo' : 'Elementos en el catálogo')}</p></Card><Card className="rounded-2xl border-border/70 p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{posEnabled ? 'Ticket promedio' : 'Módulo de ventas'}</span><div className="rounded-xl bg-sky-50 p-2 text-sky-700"><Activity className="h-5 w-5"/></div></div><p className="mt-4 text-2xl font-bold tracking-tight">{loading ? '—' : !canReadSales && posEnabled ? 'Restringido' : posEnabled ? <AnimatedCounter value={avgTicket} format={money} /> : 'Desactivado'}</p><p className="mt-1 text-xs text-muted-foreground">{posEnabled ? (!canReadSales ? 'Tu rol no permite consultar las ventas' : 'Calculado con ventas de hoy') : 'Activa Caja / Ventas para habilitarlo'}</p></Card><Card className="rounded-2xl border-border/70 p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{inventoryEnabled ? 'Stock por revisar' : 'Productos activos'}</span><div className={`rounded-xl p-2 ${lowStock.length ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}><AlertTriangle className="h-5 w-5"/></div></div><p className={`mt-4 text-2xl font-bold tracking-tight ${inventoryEnabled && lowStock.length ? 'text-rose-600' : ''}`}>{loading ? '—' : inventoryEnabled ? (!canReadCatalog ? 'Restringido' : <AnimatedCounter value={lowStock.length} />) : (!canReadCatalog ? 'Restringido' : <AnimatedCounter value={products.length} />)}</p><p className="mt-1 text-xs text-muted-foreground">{inventoryEnabled ? 'Productos en mínimo o por debajo' : 'Artículos disponibles en el catálogo'}</p></Card></div>

    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><Card className="rounded-2xl border-border/70 p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Actividad de los últimos 7 días</h2><p className="mt-1 text-sm text-muted-foreground">Ingresos y ventas registradas, sin datos de demostración.</p></div><Badge variant="secondary" className="rounded-lg">COP</Badge></div><div className="mt-5 h-[280px]">{!posEnabled ? <div className="flex h-full flex-col items-center justify-center text-center"><Activity className="h-8 w-8 text-muted-foreground/60"/><p className="mt-3 font-medium">Ventas desactivadas</p><p className="mt-1 max-w-xs text-sm text-muted-foreground">Activa Caja / Ventas en la configuración para consultar estos indicadores.</p></div> : !canReadSales ? <div className="flex h-full flex-col items-center justify-center text-center"><Activity className="h-8 w-8 text-muted-foreground/60"/><p className="mt-3 font-medium">Estadísticas restringidas</p><p className="mt-1 max-w-xs text-sm text-muted-foreground">Tu rol no permite consultar el comportamiento de las ventas.</p></div> : chartData.some(d => d.ventas > 0) ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 12, left: 2, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.55}/><XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false}/><YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={52}/><Tooltip formatter={(value: number, name: string) => name === 'Ingresos' ? [money(value), name] : [value, name]} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--card-foreground)' }}/><Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} animationBegin={150} animationDuration={800} animationEasing="ease-out"/></LineChart></ResponsiveContainer> : <div className="flex h-full flex-col items-center justify-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Activity className="h-6 w-6"/></div><p className="mt-3 font-medium">Aún no hay actividad</p><p className="mt-1 max-w-xs text-sm text-muted-foreground">Las gráficas se actualizarán cuando registres ventas reales.</p>{posEnabled && canCreateSales && <Button onClick={() => navigate('/pos')} className="mt-4 bg-orange-600 hover:bg-orange-700">Registrar primera venta</Button>}</div>}</div></Card>
      {quickActions.length > 0 && <Card className="rounded-2xl border-border/70 p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Accesos rápidos</h2><p className="mt-1 text-sm text-muted-foreground">Tareas frecuentes del negocio.</p></div><ZapIcon/></div><div className="stagger-in mt-4 space-y-2">{quickActions.map(action => <button key={action.path} onClick={() => navigate(action.path)} className="flex w-full items-center gap-3 rounded-xl border border-border/70 p-3 text-left transition hover:border-orange-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-orange-600"><action.icon className="h-5 w-5"/></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{action.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p></div><ArrowUpRight className="h-4 w-4 text-muted-foreground"/></button>)}</div></Card>}</div>

    {(posEnabled && canReadSales || inventoryEnabled && canReadCatalog) && (
      <div className="grid gap-5 lg:grid-cols-2">
        {posEnabled && canReadSales && (
          <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div>
                <h2 className="font-semibold">Ventas recientes</h2>
                <p className="mt-1 text-sm text-muted-foreground">Últimas transacciones guardadas.</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/sales')} className="text-orange-600">
                Ver todas <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            {sales.slice(0, 5).length ? (
              <div className="stagger-in divide-y divide-border/60">
                {sales.slice(0, 5).map(sale => (
                  <button key={sale.id} onClick={() => navigate(`/sales/${sale.id}`)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-muted/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{sale.productName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sale.id} · {new Date(sale.date).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{money(sale.totalPrice)}</p>
                      <p className={`mt-1 text-[11px] ${sale.status === 'completed' ? 'text-emerald-600' : sale.status === 'cancelled' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {sale.status === 'completed' ? 'Completada' : sale.status === 'cancelled' ? 'Anulada' : 'Pendiente'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">No hay ventas recientes</p>
                <p className="mt-1 text-xs text-muted-foreground">Las operaciones confirmadas se listarán aquí.</p>
              </div>
            )}
          </Card>
        )}
        {inventoryEnabled && (
          <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div>
                <h2 className="font-semibold">Alertas de inventario</h2>
                <p className="mt-1 text-sm text-muted-foreground">Productos en mínimo o por debajo.</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/products')} className="text-orange-600">
                Inventario <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            {lowStock.length ? (
              <div className="stagger-in divide-y divide-border/60">
                {lowStock.slice(0, 5).map(product => (
                  <div key={product.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Mínimo recomendado: {product.minStock}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600">{product.stock}</p>
                      <p className="text-[11px] text-muted-foreground">existencias</p>
                    </div>
                    <ArrowDownRight className="h-4 w-4 text-rose-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Package className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-3 text-sm font-medium">Todo bien con tu inventario</p>
                <p className="mt-1 text-xs text-muted-foreground">No hay productos bajo su nivel mínimo.</p>
              </div>
            )}
          </Card>
        )}
      </div>
    )}
    {user?.role === 'owner' && <SupportCenter mode="owner" />}
  </div></Layout>;
}

function ZapIcon() { return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40"><Wallet className="h-4 w-4"/></div>; }
