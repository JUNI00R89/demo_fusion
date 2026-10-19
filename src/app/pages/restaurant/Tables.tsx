import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  UtensilsCrossed
} from 'lucide-react';
import { toast } from 'sonner';

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

export function Tables() {
  const [tables] = useState<Table[]>([
    {
      id: 'T1',
      number: 1,
      capacity: 2,
      status: 'available'
    },
    {
      id: 'T2',
      number: 2,
      capacity: 4,
      status: 'occupied',
      currentOrder: {
        orderId: 'ORD-001',
        items: 5,
        total: 45.50,
        startTime: '2026-05-14T18:30:00'
      }
    },
    {
      id: 'T3',
      number: 3,
      capacity: 4,
      status: 'available'
    },
    {
      id: 'T4',
      number: 4,
      capacity: 6,
      status: 'reserved'
    },
    {
      id: 'T5',
      number: 5,
      capacity: 2,
      status: 'occupied',
      currentOrder: {
        orderId: 'ORD-002',
        items: 3,
        total: 28.00,
        startTime: '2026-05-14T19:00:00'
      }
    },
    {
      id: 'T6',
      number: 6,
      capacity: 8,
      status: 'available'
    },
    {
      id: 'T7',
      number: 7,
      capacity: 4,
      status: 'occupied',
      currentOrder: {
        orderId: 'ORD-003',
        items: 7,
        total: 68.75,
        startTime: '2026-05-14T18:45:00'
      }
    },
    {
      id: 'T8',
      number: 8,
      capacity: 2,
      status: 'available'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 border-green-300';
      case 'occupied':
        return 'bg-red-50 border-red-300';
      case 'reserved':
        return 'bg-yellow-50 border-yellow-300';
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

  const handleOpenTable = (table: Table) => {
    if (table.status === 'available') {
      toast.success(`Mesa ${table.number} abierta`, {
        description: 'Puedes comenzar a tomar la orden'
      });
    }
  };

  const handleCloseTable = (table: Table) => {
    toast.success(`Mesa ${table.number} cerrada`, {
      description: `Total: $${table.currentOrder?.total.toFixed(2)}`
    });
  };

  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const reservedTables = tables.filter(t => t.status === 'reserved').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestión de Mesas</h2>
            <p className="text-gray-600 mt-1">Control en tiempo real de tu restaurante</p>
          </div>
          <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
            <Plus size={20} className="mr-2" />
            Nueva Reserva
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mesas</p>
                <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
              </div>
              <UtensilsCrossed className="text-gray-400" size={32} />
            </div>
          </Card>

          <Card className="p-4 border-2 border-green-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{availableTables}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </Card>

          <Card className="p-4 border-2 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ocupadas</p>
                <p className="text-2xl font-bold text-red-600">{occupiedTables}</p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </Card>

          <Card className="p-4 border-2 border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reservadas</p>
                <p className="text-2xl font-bold text-yellow-600">{reservedTables}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </Card>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`p-6 border-2 transition-all hover:shadow-lg cursor-pointer ${getStatusColor(table.status)}`}
              onClick={() => handleOpenTable(table)}
            >
              <div className="space-y-4">
                {/* Table Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Mesa {table.number}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Users size={14} />
                      <span>{table.capacity} personas</span>
                    </div>
                  </div>
                  {getStatusBadge(table.status)}
                </div>

                {/* Order Info */}
                {table.currentOrder && (
                  <div className="space-y-2 pt-3 border-t border-red-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Orden:</span>
                      <span className="font-semibold">{table.currentOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-semibold">{table.currentOrder.items}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-orange-600">
                        ${table.currentOrder.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{getElapsedTime(table.currentOrder.startTime)}</span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700 mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTable(table);
                      }}
                    >
                      Cerrar Cuenta
                    </Button>
                  </div>
                )}

                {/* Available Actions */}
                {table.status === 'available' && (
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    Abrir Mesa
                  </Button>
                )}

                {table.status === 'reserved' && (
                  <div className="text-xs text-center text-yellow-700 bg-yellow-100 p-2 rounded">
                    Reservada para las 20:00
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
