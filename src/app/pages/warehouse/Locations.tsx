import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Warehouse as WarehouseIcon,
  Package,
  MapPin,
  TrendingUp,
  Search,
  Plus,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface WarehouseLocation {
  id: string;
  zone: string;
  aisle: string;
  rack: string;
  level: number;
  code: string;
  capacity: number;
  currentStock: number;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    lot: string;
    expiryDate?: string;
  }>;
}

export function Locations() {
  const [searchTerm, setSearchTerm] = useState('');

  const [locations] = useState<WarehouseLocation[]>([
    {
      id: 'LOC001',
      zone: 'A',
      aisle: '1',
      rack: 'R1',
      level: 1,
      code: 'A-1-R1-L1',
      capacity: 100,
      currentStock: 85,
      products: [
        {
          id: '1',
          name: 'Laptop Dell XPS 15',
          quantity: 25,
          lot: 'LOT-2024-001',
          expiryDate: undefined
        },
        {
          id: '2',
          name: 'Mouse Logitech MX',
          quantity: 60,
          lot: 'LOT-2024-002'
        }
      ]
    },
    {
      id: 'LOC002',
      zone: 'A',
      aisle: '1',
      rack: 'R1',
      level: 2,
      code: 'A-1-R1-L2',
      capacity: 100,
      currentStock: 45,
      products: [
        {
          id: '3',
          name: 'Teclado Mecánico RGB',
          quantity: 45,
          lot: 'LOT-2024-003'
        }
      ]
    },
    {
      id: 'LOC003',
      zone: 'A',
      aisle: '2',
      rack: 'R2',
      level: 1,
      code: 'A-2-R2-L1',
      capacity: 150,
      currentStock: 120,
      products: [
        {
          id: '4',
          name: 'Monitor LG 27"',
          quantity: 35,
          lot: 'LOT-2024-004'
        },
        {
          id: '5',
          name: 'Auriculares Sony',
          quantity: 85,
          lot: 'LOT-2024-005'
        }
      ]
    },
    {
      id: 'LOC004',
      zone: 'B',
      aisle: '1',
      rack: 'R1',
      level: 1,
      code: 'B-1-R1-L1',
      capacity: 200,
      currentStock: 180,
      products: [
        {
          id: '6',
          name: 'Webcam Logitech C920',
          quantity: 80,
          lot: 'LOT-2024-006'
        },
        {
          id: '7',
          name: 'Silla Gamer',
          quantity: 40,
          lot: 'LOT-2024-007'
        },
        {
          id: '8',
          name: 'SSD Samsung 1TB',
          quantity: 60,
          lot: 'LOT-2024-008'
        }
      ]
    },
    {
      id: 'LOC005',
      zone: 'B',
      aisle: '2',
      rack: 'R3',
      level: 1,
      code: 'B-2-R3-L1',
      capacity: 100,
      currentStock: 30,
      products: [
        {
          id: '9',
          name: 'Cable HDMI Premium',
          quantity: 30,
          lot: 'LOT-2024-009'
        }
      ]
    },
    {
      id: 'LOC006',
      zone: 'C',
      aisle: '1',
      rack: 'R1',
      level: 1,
      code: 'C-1-R1-L1',
      capacity: 80,
      currentStock: 15,
      products: [
        {
          id: '10',
          name: 'Hub USB-C 7 puertos',
          quantity: 15,
          lot: 'LOT-2024-010'
        }
      ]
    }
  ]);

  const filteredLocations = locations.filter(loc =>
    loc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getOccupancyBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const totalCapacity = locations.reduce((sum, loc) => sum + loc.capacity, 0);
  const totalStock = locations.reduce((sum, loc) => sum + loc.currentStock, 0);
  const occupancyRate = Math.round((totalStock / totalCapacity) * 100);

  const zones = Array.from(new Set(locations.map(l => l.zone))).sort();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestión de Ubicaciones</h2>
            <p className="text-gray-600 mt-1">Control de zonas y ubicaciones en bodega</p>
          </div>
          <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
            <Plus size={20} className="mr-2" />
            Nueva Ubicación
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ubicaciones</p>
                <p className="text-3xl font-bold text-orange-600">{locations.length}</p>
              </div>
              <MapPin className="text-orange-400" size={32} />
            </div>
          </Card>

          <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Capacidad Total</p>
                <p className="text-3xl font-bold text-blue-600">{totalCapacity}</p>
              </div>
              <WarehouseIcon className="text-blue-400" size={32} />
            </div>
          </Card>

          <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Actual</p>
                <p className="text-3xl font-bold text-green-600">{totalStock}</p>
              </div>
              <Package className="text-green-400" size={32} />
            </div>
          </Card>

          <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ocupación</p>
                <p className={`text-3xl font-bold ${getOccupancyColor(occupancyRate)}`}>
                  {occupancyRate}%
                </p>
              </div>
              <BarChart3 className="text-purple-400" size={32} />
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 border-2 border-orange-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar por ubicación o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-orange-200"
            />
          </div>
        </Card>

        {/* Locations by Zone */}
        {zones.map(zone => {
          const zoneLocations = filteredLocations.filter(l => l.zone === zone);
          if (zoneLocations.length === 0) return null;

          return (
            <div key={zone} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{zone}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Zona {zone}</h3>
                  <p className="text-sm text-gray-600">{zoneLocations.length} ubicaciones</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zoneLocations.map((location) => {
                  const occupancy = Math.round((location.currentStock / location.capacity) * 100);

                  return (
                    <Card
                      key={location.id}
                      className="p-6 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all"
                    >
                      <div className="space-y-4">
                        {/* Location Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">
                              {location.code}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Pasillo {location.aisle} • Rack {location.rack} • Nivel {location.level}
                            </p>
                          </div>
                          <MapPin className="text-orange-600" size={24} />
                        </div>

                        {/* Capacity */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Ocupación:</span>
                            <span className={`font-bold ${getOccupancyColor(occupancy)}`}>
                              {location.currentStock} / {location.capacity} ({occupancy}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`bar-fill h-2 rounded-full transition-all ${getOccupancyBarColor(occupancy)}`}
                              style={{ width: `${occupancy}%` }}
                            />
                          </div>
                        </div>

                        {/* Products */}
                        <div className="space-y-2 pt-3 border-t border-orange-100">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Package size={16} />
                            <span>Productos ({location.products.length})</span>
                          </div>
                          {location.products.map((product, idx) => (
                            <div
                              key={idx}
                              className="bg-orange-50 p-3 rounded-lg border border-orange-100"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-medium text-gray-900 flex-1 line-clamp-1">
                                  {product.name}
                                </p>
                                <Badge variant="outline" className="border-orange-300 text-orange-700 ml-2">
                                  {product.quantity}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">
                                Lote: {product.lot}
                              </p>
                              {product.expiryDate && (
                                <p className="text-xs text-red-600">
                                  Vence: {new Date(product.expiryDate).toLocaleDateString('es-MX')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                            onClick={() => toast.info(`Ver detalles de ${location.code}`)}
                          >
                            Ver Detalle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => toast.success('Movimiento registrado')}
                          >
                            Mover Stock
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredLocations.length === 0 && (
          <Card className="p-12 border-2 border-orange-200 text-center">
            <WarehouseIcon className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron ubicaciones</h3>
            <p className="text-gray-600">Intenta con otros términos de búsqueda</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
