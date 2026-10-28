import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  UtensilsCrossed,
  Search,
  Minus,
  ShoppingCart,
  Receipt,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { dataService, type OrderRecord } from '../../services/dataService';
import { findProductByBarcode, type Product } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';

const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const NON_KITCHEN_CATEGORIES = ['bebidas', 'gaseosas', 'aguas', 'jugos', 'café', 'te', 'cervezas', 'vinos', 'licores', 'refrescos', 'sodas'];
const goesToKitchen = (category: string) => !NON_KITCHEN_CATEGORIES.some((c) => category.toLowerCase().includes(c));

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrder?: {
    orderId: string;
    items: number;
    total: number;
    startTime: string;
  };
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  sendToKitchen: boolean;
}

export function Tables() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([
    { id: 'T1', number: 1, capacity: 2, status: 'available' },
    { id: 'T2', number: 2, capacity: 4, status: 'available' },
    { id: 'T3', number: 3, capacity: 4, status: 'available' },
    { id: 'T4', number: 4, capacity: 6, status: 'available' },
    { id: 'T5', number: 5, capacity: 2, status: 'available' },
    { id: 'T6', number: 6, capacity: 8, status: 'available' },
    { id: 'T7', number: 7, capacity: 4, status: 'available' },
    { id: 'T8', number: 8, capacity: 2, status: 'available' },
  ]);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [customerName, setCustomerName] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let active = true;
    setProducts([]);
    setOrders([]);
    void dataService.getProducts().then((list) => {
      if (!active) return;
      setProducts(list.filter((p) => p.productType !== 'ingredient' && p.productType !== 'supplies'));
    });
    void dataService.getOrders().then((list) => {
      if (!active) return;
      setOrders(list);
    });
    return () => {
      active = false;
    };
  }, [user?.businessId]);

  useEffect(() => {
    const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
    setTables((prev) =>
      prev.map((table) => {
        const order = activeOrders.find((o) => o.tableId === table.id);
        if (order) {
          const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const billOnly = readBillOnly(table.id);
          const billOnlyCount = billOnly.reduce((sum, item) => sum + item.quantity, 0);
          const billOnlyTotal = billOnly.reduce((s, i) => s + i.price * i.quantity, 0);
          return {
            ...table,
            status: 'occupied' as const,
            currentOrder: {
              orderId: order.id,
              items: itemsCount + billOnlyCount,
              total: order.total + billOnlyTotal,
              startTime: order.created_at,
            },
          };
        }
        const billOnly = readBillOnly(table.id);
        if (billOnly.length > 0) {
          return {
            ...table,
            status: 'occupied' as const,
            currentOrder: {
              orderId: `BILL-${table.id}`,
              items: billOnly.reduce((sum, item) => sum + item.quantity, 0),
              total: billOnly.reduce((s, i) => s + i.price * i.quantity, 0),
              startTime: new Date().toISOString(),
            },
          };
        }
        return { ...table, status: 'available' as const, currentOrder: undefined };
      })
    );
  }, [orders]);

  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'Todos' || product.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, activeCategory]);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        toast.error('Sin stock suficiente');
        return;
      }
      setCart(cart.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      if (product.stock < 1) {
        toast.error('Producto sin stock');
        return;
      }
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1, sku: product.sku, sendToKitchen: goesToKitchen(product.category) }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    const cartItem = cart.find((item) => item.productId === productId);
    if (!product || !cartItem) return;
    const newQty = cartItem.quantity + delta;
    if (newQty < 1) {
      setCart(cart.filter((item) => item.productId !== productId));
      return;
    }
    if (newQty > product.stock) {
      toast.error('Sin stock suficiente');
      return;
    }
    setCart(cart.map((item) => (item.productId === productId ? { ...item, quantity: newQty } : item)));
  };

  const removeFromCart = (productId: string) => setCart(cart.filter((item) => item.productId !== productId));

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const openTable = (table: Table) => {
    setSelectedTable(table);
    setCart([]);
    setCustomerName(user?.name || '');
    setSearchTerm('');
    setActiveCategory('Todos');
    if (table.status === 'occupied' && table.currentOrder) {
      const order = orders.find((o) => o.id === table.currentOrder?.orderId);
      const kitchenItems = order
        ? order.items.map((item) => ({
            productId: item.productId,
            name: item.productName,
            price: item.unitPrice,
            quantity: item.quantity,
            sku: products.find((p) => p.id === item.productId)?.sku || '',
            sendToKitchen: true,
          }))
        : [];
      const billOnlyItems = readBillOnly(table.id).map((item) => ({
        ...item,
        sendToKitchen: false,
      }));
      setCart([...kitchenItems, ...billOnlyItems]);
    }
    setShowOrderModal(true);
  };

  const billOnlyKey = (tableId: string) => `table_bill_only_${tableId}`;

  const readBillOnly = (tableId: string): CartItem[] => {
    try {
      const raw = localStorage.getItem(billOnlyKey(tableId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const writeBillOnly = (tableId: string, items: CartItem[]) => {
    if (items.length === 0) {
      localStorage.removeItem(billOnlyKey(tableId));
    } else {
      localStorage.setItem(billOnlyKey(tableId), JSON.stringify(items));
    }
  };

  const saveTableOrder = async () => {
    if (!selectedTable) return;
    if (cart.length === 0) {
      toast.error('Agrega al menos un producto a la mesa');
      return;
    }
    setSavingOrder(true);
    try {
      const kitchenItems = cart.filter((item) => item.sendToKitchen);
      const billOnlyItems = cart.filter((item) => !item.sendToKitchen);

      // Merge bill-only items with any existing bill-only items for this table
      const existingBillOnly = readBillOnly(selectedTable.id);
      const mergedBillOnly = [...existingBillOnly];
      billOnlyItems.forEach((newItem) => {
        const existing = mergedBillOnly.find((i) => i.productId === newItem.productId);
        if (existing) {
          existing.quantity += newItem.quantity;
        } else {
          mergedBillOnly.push({ ...newItem });
        }
      });
      writeBillOnly(selectedTable.id, mergedBillOnly);

      if (kitchenItems.length > 0) {
        await dataService.createOrder({
          channel: 'table',
          customer: customerName.trim() || `Mesa ${selectedTable.number}`,
          phone: '',
          address: '',
          notes: `Mesa ${selectedTable.number}`,
          tableId: selectedTable.id,
          tableNumber: selectedTable.number,
          items: kitchenItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        });
      }

      const refreshed = await dataService.getOrders();
      setOrders(refreshed);

      const kitchenCount = kitchenItems.reduce((s, i) => s + i.quantity, 0);
      const billCount = billOnlyItems.reduce((s, i) => s + i.quantity, 0);
      const parts: string[] = [];
      if (kitchenCount > 0) parts.push(`${kitchenCount} a cocina`);
      if (billCount > 0) parts.push(`${billCount} a cuenta`);
      toast.success(`Mesa ${selectedTable.number} actualizada`, {
        description: parts.join(' · ') + ` · ${money(cartTotal)}`,
      });
      setShowOrderModal(false);
      setCart([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el pedido');
    } finally {
      setSavingOrder(false);
    }
  };

  const closeTable = async (table: Table) => {
    if (!table.currentOrder) return;
    setClosing(true);
    try {
      await dataService.updateOrderStatus(table.currentOrder.orderId, 'delivered');
      // Clear bill-only items for this table
      const billOnlyItems = readBillOnly(table.id);
      const billOnlyTotal = billOnlyItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const totalCharged = table.currentOrder.total + billOnlyTotal;
      writeBillOnly(table.id, []);
      const refreshed = await dataService.getOrders();
      setOrders(refreshed);
      toast.success(`Mesa ${table.number} cerrada`, {
        description: `Total cobrado: ${money(totalCharged)}`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cerrar la mesa');
    } finally {
      setClosing(false);
    }
  };

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = searchTerm.trim();
      const product = products.find((p) => p.sku.toLowerCase() === code.toLowerCase() || p.codigosBarras?.includes(code)) || findProductByBarcode(code);
      if (product) {
        addToCart(product);
        setSearchTerm('');
        toast.success(`${product.name} añadido`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'occupied':
        return 'bg-rose-500/10 border-rose-500/30';
      case 'reserved':
        return 'bg-amber-500/10 border-amber-500/30';
      default:
        return 'bg-muted border-border';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-emerald-500 text-white">Disponible</Badge>;
      case 'occupied':
        return <Badge className="bg-rose-500 text-white">Ocupada</Badge>;
      case 'reserved':
        return <Badge className="bg-amber-500 text-white">Reservada</Badge>;
      default:
        return null;
    }
  };

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
    return `${diff} min`;
  };

  const availableTables = tables.filter((t) => t.status === 'available').length;
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const reservedTables = tables.filter((t) => t.status === 'reserved').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestión de Mesas</h2>
            <p className="text-muted-foreground mt-1">Abre una mesa, toma el pedido y envíalo a cocina</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Mesas</p>
                <p className="text-2xl font-bold text-foreground">{tables.length}</p>
              </div>
              <UtensilsCrossed className="text-muted-foreground" size={32} />
            </div>
          </Card>

          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-emerald-500">{availableTables}</p>
              </div>
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
          </Card>

          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupadas</p>
                <p className="text-2xl font-bold text-rose-500">{occupiedTables}</p>
              </div>
              <XCircle className="text-rose-500" size={32} />
            </div>
          </Card>

          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservadas</p>
                <p className="text-2xl font-bold text-amber-500">{reservedTables}</p>
              </div>
              <Clock className="text-amber-500" size={32} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`p-5 border transition-all hover:shadow-md cursor-pointer ${getStatusColor(table.status)}`}
              onClick={() => openTable(table)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Mesa {table.number}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Users size={14} />
                      <span>{table.capacity} personas</span>
                    </div>
                  </div>
                  {getStatusBadge(table.status)}
                </div>

                {table.currentOrder && (
                  <div className="space-y-2 pt-3 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Orden:</span>
                      <span className="font-semibold text-foreground">{table.currentOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items:</span>
                      <span className="font-semibold text-foreground">{table.currentOrder.items}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold text-primary">{money(table.currentOrder.total)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} />
                      <span>{getElapsedTime(table.currentOrder.startTime)}</span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-rose-600 hover:bg-rose-700"
                      disabled={closing}
                      onClick={(e) => {
                        e.stopPropagation();
                        void closeTable(table);
                      }}
                    >
                      <Receipt size={14} className="mr-1" />
                      {closing ? 'Cerrando...' : 'Cerrar Cuenta'}
                    </Button>
                  </div>
                )}

                {table.status === 'available' && (
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Plus size={14} className="mr-1" />
                    Abrir Mesa
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="w-full sm:w-[96vw] max-w-full sm:max-w-7xl max-h-[100vh] sm:max-h-[92vh] overflow-y-auto p-0 top-0 sm:top-[4%] translate-y-0 rounded-none sm:rounded-lg">
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="text-primary" size={24} />
              {selectedTable?.status === 'occupied' ? `Editar Pedido - Mesa ${selectedTable.number}` : `Abrir Mesa ${selectedTable?.number}`}
            </DialogTitle>
            <DialogDescription>Selecciona productos y envíalos a cocina</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 sm:gap-8 px-4 sm:px-8 pb-8">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Buscar producto o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleBarcodeSearch}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:bg-accent/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="p-5 border cursor-pointer hover:border-primary transition-colors min-h-[80px] outline-none focus:outline-none focus:ring-0"
                    onClick={() => addToCart(product)}
                  >
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground line-clamp-2">{product.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                        <span className="text-base font-bold text-primary">{money(product.price)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart className="text-primary" size={20} />
                  <h3 className="font-bold">Pedido de Mesa {selectedTable?.number}</h3>
                  <Badge className="ml-auto bg-primary text-primary-foreground">{cartItemsCount} items</Badge>
                </div>

                <Input
                  placeholder="Nombre del cliente (opcional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mb-3 h-9"
                />

                <Separator className="mb-3" />

                <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="mx-auto mb-2 opacity-30" size={40} />
                      <p className="text-sm">Sin productos</p>
                      <p className="text-xs">Selecciona productos del menú</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.productId} className="bg-accent/50 rounded-lg p-3 border border-border">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{money(item.price)} c/u</p>
                          </div>
                          <button onClick={() => removeFromCart(item.productId)} className="ml-1 p-1 hover:text-rose-500 text-muted-foreground">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <button
                            onClick={() => setCart(cart.map((c) => c.productId === item.productId ? { ...c, sendToKitchen: !c.sendToKitchen } : c))}
                            className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${item.sendToKitchen ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                          >
                            {item.sendToKitchen ? '🍳 A cocina' : '📋 Solo cuenta'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-accent">
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-base font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-accent">
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-primary">{money(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="mb-3" />

                <div className="flex justify-between font-bold text-base mb-4">
                  <span>Total</span>
                  <span className="text-primary">{money(cartTotal)}</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowOrderModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => void saveTableOrder()}
                    disabled={cart.length === 0 || savingOrder}
                    className="flex-1 bg-primary hover:bg-primary-hover"
                  >
                    {savingOrder ? 'Guardando...' : cart.some((i) => i.sendToKitchen) ? 'Enviar a Cocina' : 'Agregar a Cuenta'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
