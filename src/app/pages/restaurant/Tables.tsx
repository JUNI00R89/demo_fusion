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
  }, []);

  useEffect(() => {
    const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
    setTables((prev) =>
      prev.map((table) => {
        const order = activeOrders.find((o) => o.tableId === table.id);
        if (order) {
          const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          return {
            ...table,
            status: 'occupied' as const,
            currentOrder: {
              orderId: order.id,
              items: itemsCount,
              total: order.total,
              startTime: order.created_at,
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
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1, sku: product.sku }]);
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
      if (order) {
        setCart(
          order.items.map((item) => ({
            productId: item.productId,
            name: item.productName,
            price: item.unitPrice,
            quantity: item.quantity,
            sku: products.find((p) => p.id === item.productId)?.sku || '',
          }))
        );
      }
    }
    setShowOrderModal(true);
  };

  const saveTableOrder = async () => {
    if (!selectedTable) return;
    if (cart.length === 0) {
      toast.error('Agrega al menos un producto a la mesa');
      return;
    }
    setSavingOrder(true);
    try {
      await dataService.createOrder({
        channel: 'table',
        customer: customerName.trim() || `Mesa ${selectedTable.number}`,
        phone: '',
        address: '',
        notes: `Mesa ${selectedTable.number}`,
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });
      const refreshed = await dataService.getOrders();
      setOrders(refreshed);
      toast.success(`Pedido enviado a cocina - Mesa ${selectedTable.number}`, {
        description: `${cartItemsCount} producto(s) · ${money(cartTotal)}`,
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
      const refreshed = await dataService.getOrders();
      setOrders(refreshed);
      toast.success(`Mesa ${table.number} cerrada`, {
        description: `Total cobrado: ${money(table.currentOrder.total)}`,
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
        return 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800';
      case 'occupied':
        return 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800';
      case 'reserved':
        return 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-600 text-white">Disponible</Badge>;
      case 'occupied':
        return <Badge className="bg-red-600 text-white">Ocupada</Badge>;
      case 'reserved':
        return <Badge className="bg-yellow-600 text-white">Reservada</Badge>;
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

          <Card className="p-4 border-2 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{availableTables}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </Card>

          <Card className="p-4 border-2 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupadas</p>
                <p className="text-2xl font-bold text-red-600">{occupiedTables}</p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </Card>

          <Card className="p-4 border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservadas</p>
                <p className="text-2xl font-bold text-yellow-600">{reservedTables}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`p-5 border-2 transition-all hover:shadow-lg cursor-pointer ${getStatusColor(table.status)}`}
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
                  <div className="space-y-2 pt-3 border-t border-red-200 dark:border-red-800">
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
                      <span className="font-bold text-orange-600">{money(table.currentOrder.total)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} />
                      <span>{getElapsedTime(table.currentOrder.startTime)}</span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700"
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
                  <Button size="sm" className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
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
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="text-orange-600" size={24} />
              {selectedTable?.status === 'occupied' ? `Editar Pedido - Mesa ${selectedTable.number}` : `Abrir Mesa ${selectedTable?.number}`}
            </DialogTitle>
            <DialogDescription>Selecciona productos y envíalos a cocina</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Buscar producto o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleBarcodeSearch}
                  className="pl-10 h-11"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-accent text-muted-foreground hover:bg-orange-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="p-3 border cursor-pointer hover:border-orange-400 hover:shadow-sm transition-all"
                    onClick={() => addToCart(product)}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{product.name}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                        <span className="text-sm font-bold text-orange-600">{money(product.price)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart className="text-orange-600" size={20} />
                  <h3 className="font-bold">Pedido de Mesa {selectedTable?.number}</h3>
                  <Badge className="ml-auto bg-orange-500 text-white">{cartItemsCount} items</Badge>
                </div>

                <Input
                  placeholder="Nombre del cliente (opcional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mb-3 h-9"
                />

                <Separator className="mb-3" />

                <div className="space-y-2 max-h-[300px] overflow-y-auto mb-3">
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
                          <button onClick={() => removeFromCart(item.productId)} className="ml-1 p-1 hover:text-red-500 text-muted-foreground">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-orange-50">
                              <Minus size={12} />
                            </button>
                            <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-orange-50">
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-orange-600">{money(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="mb-3" />

                <div className="flex justify-between font-bold text-base mb-4">
                  <span>Total</span>
                  <span className="text-orange-600">{money(cartTotal)}</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowOrderModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => void saveTableOrder()}
                    disabled={cart.length === 0 || savingOrder}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    {savingOrder ? 'Enviando...' : 'Enviar a Cocina'}
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
