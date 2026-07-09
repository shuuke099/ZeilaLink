'use client';

import { useEffect, useState } from 'react';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';

type Booking = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  responsibleFullName?: string | null;
  serviceDateTime?: string | null;
  isRemote?: boolean;
  locationAddress?: string | null;
  paymentStatus?: string;
  status: string;
  createdAt: string;
  service: {
    id: string;
    title: string;
    category: string;
    provider: string;
    priceLabel: string;
  };
};

const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AdminServiceBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/service-bookings');
      setBookings(response.data?.bookings || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/service-bookings/${id}/status`, { status });
      setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status } : booking)));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update status');
    }
  };

  return (
    <AdminDashboardPage
      title="Service Bookings"
      description="Track bookings made by users from the Services page."
    >
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-slate-500">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-slate-500">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Service</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Schedule</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Booked</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-slate-900">{booking.service.title}</p>
                      <p className="text-xs text-slate-500">{booking.service.category} | {booking.service.provider}</p>
                      <p className="text-xs text-primary font-semibold">{booking.service.priceLabel}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate-800 font-medium">{booking.customerName}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      <p>{booking.customerEmail}</p>
                      {booking.customerPhone && <p className="text-xs">{booking.customerPhone}</p>}
                      {booking.responsibleFullName && (
                        <p className="text-xs text-slate-500 mt-1">Responsible: {booking.responsibleFullName}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {booking.serviceDateTime ? new Date(booking.serviceDateTime).toLocaleString() : 'Not set'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {booking.isRemote ? 'Remote / Online' : (booking.locationAddress || 'On-site')}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700">
                        {booking.paymentStatus || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{new Date(booking.createdAt).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={booking.status}
                        onChange={(e) => updateStatus(booking.id, e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1 bg-white"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600 font-semibold">{error}</p>}
      </section>
    </AdminDashboardPage>
  );
}
