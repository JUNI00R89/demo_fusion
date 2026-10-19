import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, Users, Activity, CircleDollarSign, ShieldCheck, LogOut, RefreshCw, Ban, CheckCircle2, LoaderCircle, History } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getPlatformAudit, getPlatformBusinesses, getPlatformStats, getPlatformUsers, createPlatformUser, getPlatformSubscriptions, updatePlatformSubscription, setPlatformBusinessStatus, setPlatformUserStatus, type PlatformUserRecord, type PlatformAuditRecord, type PlatformSubscriptionRecord } from '../services/dataService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { Card } from '../components/ui/card';
import { SupportCenter } from '../components/SupportCenter';

interface PlatformStats {
  businesses: number; activeBusinesses: number; users: number; activeUsers: number; completedSales: number; salesVolumeCOP: number;
}
interface PlatformBusiness {
  id: string; name: string; type: string; currency: string; active: boolean; createdAt: string; users: number; suspensionReason?: string; suspensionDescription?: string;
}
const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value || 0);
const TYPE_LABELS: Record<string, string> = { retail: 'Tienda / Retail', food: 'Negocio de comidas', restaurant: 'Negocio de comidas', hotel: 'Hotel / hospedaje', warehouse: 'Bodega', services: 'Servicios' };

export function PlatformAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [businesses, setBusinesses] = useState<PlatformBusiness[]>([]);
  const [users, setUsers] = useState<PlatformUserRecord[]>([]);
  const [events, setEvents] = useState<PlatformAuditRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<PlatformSubscriptionRecord[]>([]);
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({});
  const [subscriptionBusyId, setSubscriptionBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [userStatusTarget, setUserStatusTarget] = useState<PlatformUserRecord | null>(null);
  const [businessStatusTarget, setBusinessStatusTarget] = useState<PlatformBusiness | null>(null);
  const [suspensionTarget, setSuspensionTarget] = useState<PlatformBusiness | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDescription, setSuspensionDescription] = useState('');
  const [suspensionValidation, setSuspensionValidation] = useState('');
  const [dialogBusy, setDialogBusy] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserBusy, setCreateUserBusy] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'owner' as 'superadmin' | 'owner' | 'business_admin' | 'cashier', businessId: '' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStats, nextBusinesses, nextUsers, nextEvents, nextSubscriptions] = await Promise.all([getPlatformStats(), getPlatformBusinesses(), getPlatformUsers(), getPlatformAudit(30), getPlatformSubscriptions()]);
      setStats(nextStats);
      setBusinesses(nextBusinesses);
      setUsers(nextUsers);
      setEvents(nextEvents);
      setSubscriptions(nextSubscriptions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar la información de la plataforma.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const confirmUserStatus = async () => {
    if (!userStatusTarget) return;
    const target = userStatusTarget;
    const active = !target.active;
    setBusyId(target.id);
    try {
      await setPlatformUserStatus(target.id, active);
      toast.success(`Usuario ${active ? 'reactivado' : 'suspendido'}.`);
      await refresh();
      setUserStatusTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el usuario.');
      throw error;
    } finally { setBusyId(null); }
  };

  const handleSubscriptionAction = async (subscription: PlatformSubscriptionRecord, action: 'confirm_payment' | 'cancel_request') => {
    if (action === 'confirm_payment' && (paymentRefs[subscription.businessId] || '').trim().length < 4) { toast.error('Introduce la referencia del pago verificado (mínimo 4 caracteres).'); return; }
    setSubscriptionBusyId(subscription.businessId);
    try {
      await updatePlatformSubscription(subscription.businessId, action, paymentRefs[subscription.businessId]);
      toast.success(action === 'confirm_payment' ? 'Plan activado tras registrar la verificación manual del pago.' : 'Solicitud de suscripción cancelada.');
      await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la suscripción.'); }
    finally { setSubscriptionBusyId(null); }
  };

  const submitNewUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateUserBusy(true);
    try {
      await createPlatformUser({ name: newUser.name.trim(), email: newUser.email.trim(), password: newUser.password, role: newUser.role, businessId: newUser.role === 'superadmin' ? null : newUser.businessId });
      toast.success('Usuario creado correctamente.');
      setNewUser({ name: '', email: '', password: '', role: 'owner', businessId: '' });
      setCreateUserOpen(false);
      await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo crear el usuario.'); }
    finally { setCreateUserBusy(false); }
  };

  const requestBusinessStatus = (business: PlatformBusiness) => {
    if (business.active) {
      setSuspensionReason('');
      setSuspensionDescription('');
      setSuspensionValidation('');
      setSuspensionTarget(business);
    } else {
      setBusinessStatusTarget(business);
    }
  };

  const confirmSuspension = async () => {
    if (!suspensionTarget) return;
    const reason = suspensionReason.trim();
    if (reason.length < 4) {
      setSuspensionValidation('Escribe un motivo de al menos 4 caracteres.');
      return;
    }
    const target = suspensionTarget;
    setDialogBusy(true);
    setBusyId(target.id);
    try {
      await setPlatformBusinessStatus(target.id, false, reason, suspensionDescription.trim());
      toast.success('Negocio suspendido. El propietario podrá consultar el motivo y comunicarse con soporte.');
      setSuspensionTarget(null);
      setSuspensionReason('');
      setSuspensionDescription('');
      setSuspensionValidation('');
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo suspender el negocio.');
    } finally {
      setBusyId(null);
      setDialogBusy(false);
    }
  };

  const confirmBusinessReactivation = async () => {
    if (!businessStatusTarget) return;
    const target = businessStatusTarget;
    setBusyId(target.id);
    try {
      await setPlatformBusinessStatus(target.id, true);
      toast.success('Negocio reactivado.');
      setBusinessStatusTarget(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo reactivar el negocio.');
      throw error;
    } finally { setBusyId(null); }
  };

  const signOut = () => { logout(); navigate('/login'); };
  const tiles = [
    { label: 'Negocios registrados', value: stats?.businesses ?? 0, detail: `${stats?.activeBusinesses ?? 0} activos`, icon: Building2 },
    { label: 'Usuarios', value: stats?.users ?? 0, detail: `${stats?.activeUsers ?? 0} activos`, icon: Users },
    { label: 'Ventas completadas', value: stats?.completedSales ?? 0, detail: 'Registros globales guardados', icon: Activity },
    { label: 'Volumen de ventas', value: money(stats?.salesVolumeCOP ?? 0), detail: 'No representa ingresos por suscripción', icon: CircleDollarSign },
  ];

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg"><ShieldCheck size={23}/></div>
          <div className="min-w-0"><p className="truncate text-sm font-bold">MANAGER STOCK</p><p className="text-xs text-slate-500">Centro de administración global</p></div>
          <span className="hidden rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold tracking-wide text-violet-700 sm:inline-flex">SUPERADMIN</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user?.name}</p><p className="text-xs text-slate-500">{user?.email}</p></div>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading} className="rounded-xl"><RefreshCw size={15} className={loading ? 'mr-2 animate-spin' : 'mr-2'}/>Actualizar</Button>
          <Button variant="ghost" onClick={signOut} className="rounded-xl text-slate-600"><LogOut size={16} className="mr-2"/>Salir</Button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-7 text-white shadow-xl sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-indigo-200">Control de plataforma</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Panel global</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Administra los negocios registrados, revisa el uso de la plataforma y controla el estado de las cuentas. Las métricas se calculan sobre los datos persistidos en SQLite.</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(tile => <Card key={tile.label} className="rounded-2xl border-slate-200 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{tile.label}</p><p className="mt-3 text-2xl font-bold tracking-tight">{loading ? '—' : tile.value}</p><p className="mt-1 text-xs text-slate-500">{tile.detail}</p></div><div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><tile.icon size={21}/></div></div></Card>)}
      </section>
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Negocios registrados</h2><p className="mt-1 text-sm text-slate-500">El SUPERADMIN puede activar o suspender el acceso global de un negocio.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">{businesses.length} negocios</span></div>
        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          {loading && !businesses.length ? <div className="flex items-center justify-center gap-3 p-12 text-slate-500"><LoaderCircle className="animate-spin"/>Cargando negocios…</div> : businesses.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4 font-semibold">Negocio</th><th className="px-5 py-4 font-semibold">Tipo</th><th className="px-5 py-4 font-semibold">Usuarios</th><th className="px-5 py-4 font-semibold">Registro</th><th className="px-5 py-4 font-semibold">Estado</th><th className="px-5 py-4 text-right font-semibold">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{businesses.map(business => <tr key={business.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{business.name}</p><p className="mt-1 font-mono text-[11px] text-slate-400">{business.id}</p></td><td className="px-5 py-4 text-slate-600">{TYPE_LABELS[business.type] || business.type}</td><td className="px-5 py-4 tabular-nums">{business.users}</td><td className="px-5 py-4 text-slate-500">{business.createdAt ? new Date(business.createdAt.replace(' ', 'T') + (business.createdAt.includes('Z') ? '' : 'Z')).toLocaleDateString('es-CO') : '—'}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${business.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{business.active ? <CheckCircle2 size={13}/> : <Ban size={13}/>} {business.active ? 'Activo' : 'Suspendido'}</span></td><td className="px-5 py-4 text-right"><Button size="sm" variant={business.active ? 'outline' : 'default'} disabled={busyId === business.id} onClick={() => requestBusinessStatus(business)} className="rounded-lg">{busyId === business.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : null}{business.active ? 'Suspender' : 'Reactivar'}</Button></td></tr>)}</tbody></table></div> : <div className="p-12 text-center"><Building2 className="mx-auto h-10 w-10 text-slate-300"/><p className="mt-3 font-semibold">No hay negocios registrados</p><p className="mt-1 text-sm text-slate-500">Los negocios nuevos aparecerán después de registrarse.</p></div>}
        </Card>
      </section>
      <section>
        <div className="mb-4"><h2 className="text-xl font-bold">Suscripciones</h2><p className="mt-1 text-sm text-slate-500">Las solicitudes pagas requieren verificación externa. Solo confirma un pago después de comprobarlo con el proveedor; esta acción registra una verificación manual.</p></div>
        <div className="grid gap-3 lg:grid-cols-2">{subscriptions.map(subscription => <Card key={subscription.businessId} className="rounded-2xl border-slate-200 p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{subscription.businessName}</p><p className="mt-1 text-xs text-slate-500">{subscription.businessId}</p><p className="mt-2 text-sm">Plan actual: <strong>{subscription.plan.name}</strong></p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${subscription.status==='active'?'bg-emerald-50 text-emerald-700':subscription.status==='pending_payment'?'bg-amber-50 text-amber-800':'bg-slate-100 text-slate-600'}`}>{subscription.status==='active'?'Activo':subscription.status==='pending_payment'?'Pago pendiente':subscription.status}</span></div>{subscription.pendingPlan && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-semibold text-amber-900">Solicitud: {subscription.pendingPlan.name} · {money(subscription.pendingPlan.priceCOP)}/mes</p><label className="mt-3 block space-y-1.5 text-xs font-medium text-amber-900"><span>Referencia del pago verificado</span><Input value={paymentRefs[subscription.businessId] || ''} onChange={e=>setPaymentRefs({...paymentRefs,[subscription.businessId]:e.target.value})} placeholder="Referencia del proveedor o recibo" maxLength={120}/></label><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={subscriptionBusyId===subscription.businessId} onClick={()=>void handleSubscriptionAction(subscription,'confirm_payment')} className="rounded-lg bg-emerald-700 text-white hover:bg-emerald-800">Confirmar pago verificado</Button><Button size="sm" variant="outline" disabled={subscriptionBusyId===subscription.businessId} onClick={()=>void handleSubscriptionAction(subscription,'cancel_request')} className="rounded-lg">Cancelar solicitud</Button></div></div>}</Card>)}</div>
      </section>
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Usuarios de la plataforma</h2><p className="mt-1 text-sm text-slate-500">Cuentas globales y estado de acceso. Los roles privilegiados no se pueden asignar desde el frontend del negocio.</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">{users.length} usuarios</span><Button onClick={() => setCreateUserOpen(v => !v)} className="rounded-xl bg-indigo-700 text-white hover:bg-indigo-800"><Users size={15} className="mr-2"/>Crear usuario</Button></div></div>
        {createUserOpen && <Card className="mb-4 rounded-2xl border-indigo-100 p-5 shadow-sm"><form onSubmit={submitNewUser} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><div className="sm:col-span-2 xl:col-span-3"><h3 className="font-semibold">Crear cuenta de plataforma o negocio</h3><p className="mt-1 text-sm text-slate-500">Las cuentas de negocio requieren un negocio existente. SUPERADMIN es una cuenta global y no pertenece a una empresa.</p></div><div className="space-y-1.5"><Label htmlFor="new-user-name">Nombre completo</Label><Input id="new-user-name" required minLength={2} maxLength={120} value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} /></div><div className="space-y-1.5"><Label htmlFor="new-user-email">Correo</Label><Input id="new-user-email" required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})}/></div><div className="space-y-1.5"><Label htmlFor="new-user-password">Contraseña inicial</Label><Input id="new-user-password" required minLength={8} type="password" autoComplete="new-password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})}/></div><div className="space-y-1.5"><Label htmlFor="new-user-role">Rol</Label><select id="new-user-role" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value as typeof newUser.role})}><option value="owner">Propietario</option><option value="business_admin">Administrador de negocio</option><option value="cashier">Empleado / cajero</option><option value="superadmin">SUPERADMIN</option></select></div>{newUser.role !== 'superadmin' && <div className="space-y-1.5"><Label htmlFor="new-user-business">Negocio</Label><select id="new-user-business" required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={newUser.businessId} onChange={e=>setNewUser({...newUser,businessId:e.target.value})}><option value="">Selecciona un negocio</option>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}</select></div>}<div className="flex items-end gap-2"><Button type="submit" disabled={createUserBusy} className="rounded-xl bg-indigo-700 text-white hover:bg-indigo-800">{createUserBusy?'Creando…':'Crear usuario'}</Button><Button type="button" variant="outline" onClick={()=>setCreateUserOpen(false)} className="rounded-xl">Cancelar</Button></div></form></Card>}
        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">{loading && !users.length ? <div className="p-10 text-center text-slate-500">Cargando usuarios…</div> : users.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4 font-semibold">Usuario</th><th className="px-5 py-4 font-semibold">Negocio</th><th className="px-5 py-4 font-semibold">Rol</th><th className="px-5 py-4 font-semibold">Estado</th><th className="px-5 py-4 text-right font-semibold">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map(target => <tr key={target.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold">{target.name}</p><p className="mt-1 text-xs text-slate-500">{target.email}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{target.id}</p></td><td className="px-5 py-4 text-slate-600">{target.businessName || 'Plataforma'}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${target.role === 'superadmin' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'}`}>{target.role === 'superadmin' ? 'SUPERADMIN' : target.role === 'owner' ? 'Propietario' : target.role === 'business_admin' ? 'Administrador' : 'Cajero'}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${target.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{target.active ? 'Activo' : 'Suspendido'}</span></td><td className="px-5 py-4 text-right">{target.role === 'superadmin' && target.id === user?.id ? <span className="text-xs text-slate-500">Sesión actual</span> : <Button size="sm" variant="outline" disabled={busyId === target.id} onClick={() => setUserStatusTarget(target)} className="rounded-lg">{target.active ? 'Suspender' : 'Reactivar'}</Button>}</td></tr>)}</tbody></table></div> : <div className="p-12 text-center text-slate-500">No hay cuentas para mostrar.</div>}</Card>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Actividad administrativa global</h2><p className="mt-1 text-sm text-slate-500">Registro de suspensiones y reactivaciones ejecutadas desde este panel.</p></div><History className="h-5 w-5 text-slate-400"/></div>
        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          {events.length ? <div className="divide-y divide-slate-100">{events.map(event => <div key={event.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-700"><Activity size={16}/></span><div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{event.action === 'suspend' ? 'Negocio suspendido' : event.action === 'activate' ? 'Negocio reactivado' : event.action === 'suspend_user' ? 'Usuario suspendido' : event.action === 'activate_user' ? 'Usuario reactivado' : event.action}</p><p className="mt-1 break-all text-xs text-slate-500">{event.entityId} · Ejecutado por {event.actorName}</p></div></div><time className="shrink-0 text-xs text-slate-400">{event.createdAt ? new Date(event.createdAt).toLocaleString('es-CO') : 'Fecha no disponible'}</time></div>)}</div> : <div className="p-8 text-center text-sm text-slate-500">Todavía no hay eventos administrativos globales.</div>}
        </Card>
      </section>
      <section>
        <SupportCenter mode="platform" />
      </section>
      <p className="text-xs leading-5 text-slate-500">Nota: el volumen de ventas corresponde a ventas completadas de los negocios y no equivale a ingresos de la plataforma. La gestión de suscripciones solo debe habilitarse cuando exista una integración de cobro real.</p>
    </main>

    <ConfirmActionDialog
      open={Boolean(userStatusTarget)}
      onOpenChange={open => { if (!open) setUserStatusTarget(null); }}
      title={userStatusTarget?.active ? 'Suspender acceso del usuario' : 'Reactivar acceso del usuario'}
      description={userStatusTarget ? `¿${userStatusTarget.active ? 'Suspender' : 'reactivar'} el acceso de ${userStatusTarget.name}?` : ''}
      confirmLabel={userStatusTarget?.active ? 'Suspender usuario' : 'Reactivar usuario'}
      destructive={Boolean(userStatusTarget?.active)}
      onConfirm={confirmUserStatus}
    />

    <Dialog open={Boolean(suspensionTarget)} onOpenChange={open => { if (!open && !dialogBusy) { setSuspensionTarget(null); setSuspensionValidation(''); } }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-slate-200 p-5 shadow-2xl sm:max-w-xl sm:p-6">
        <DialogHeader className="pr-7 text-left">
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><Ban size={20}/></div>
          <DialogTitle className="text-xl">Suspender negocio</DialogTitle>
          <DialogDescription className="leading-6">El negocio <strong>{suspensionTarget?.name}</strong> dejará de operar temporalmente. Su propietario podrá iniciar sesión para consultar el motivo y comunicarse con soporte.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="suspension-reason">Motivo de la suspensión <span className="text-rose-600">*</span></Label>
            <Input id="suspension-reason" autoFocus value={suspensionReason} onChange={event => { setSuspensionReason(event.target.value); if (suspensionValidation) setSuspensionValidation(''); }} maxLength={180} placeholder="Ej. Incumplimiento de las condiciones de uso" aria-invalid={Boolean(suspensionValidation)} className="h-11 rounded-xl" />
            {suspensionValidation && <p role="alert" className="text-sm text-rose-600">{suspensionValidation}</p>}
            <p className="text-xs text-slate-500">Mínimo 4 caracteres. El propietario verá este motivo.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="suspension-description">Descripción adicional (opcional)</Label>
            <Textarea id="suspension-description" value={suspensionDescription} onChange={event => setSuspensionDescription(event.target.value)} rows={4} maxLength={3000} placeholder="Explica el contexto, los pasos para resolver la situación o la información que el propietario debe aportar." className="resize-y rounded-xl" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:flex-row-reverse">
          <Button type="button" variant="destructive" disabled={dialogBusy} onClick={() => void confirmSuspension()} className="rounded-xl">
            {dialogBusy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}{dialogBusy ? 'Suspendiendo…' : 'Confirmar suspensión'}
          </Button>
          <Button type="button" variant="outline" disabled={dialogBusy} onClick={() => setSuspensionTarget(null)} className="rounded-xl">Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmActionDialog
      open={Boolean(businessStatusTarget)}
      onOpenChange={open => { if (!open) setBusinessStatusTarget(null); }}
      title="Reactivar negocio"
      description={businessStatusTarget ? `¿Deseas reactivar ${businessStatusTarget.name}? El propietario volverá a tener acceso a las operaciones permitidas.` : ''}
      confirmLabel="Reactivar negocio"
      onConfirm={confirmBusinessReactivation}
    />
  </div>;
}
