// components/notification-bell.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button"; // Solo usa Button que ya tienes
import { useSession } from "next-auth/react";

interface Notification {
  id: string;
  titulo: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
  anuncio_id: string;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función para formatear fecha relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "hace un momento";
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString('es-MX');
  };

  // Cargar notificaciones
  const fetchNotifications = async () => {
    if (!session?.user?.email) return;
    
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (userError || !userData) {
        console.error("Usuario no encontrado:", userError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notificaciones_usuarios")
        .select("*")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error al cargar notificaciones:", error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.leido).length || 0);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notificaciones_usuarios")
        .update({ leido: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, leido: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.leido).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notificaciones_usuarios")
        .update({ leido: true, updated_at: new Date().toISOString() })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, leido: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  // Cargar notificaciones al montar
  useEffect(() => {
    if (session?.user?.email) {
      fetchNotifications();

      // Configurar suscripción en tiempo real
      const setupRealtimeSubscription = async () => {
        const { data: userData } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", session.user.email!)
          .single();

        if (!userData) return;

        const channel = supabase
          .channel(`notifications-${userData.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notificaciones_usuarios",
              filter: `user_id=eq.${userData.id}`,
            },
            (payload) => {
              setNotifications(prev => [payload.new as Notification, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      };

      const cleanup = setupRealtimeSubscription();
      return () => {
        cleanup.then(fn => fn && fn());
      };
    }
  }, [session?.user?.email]);

  // Actualizar cuando se abre
  useEffect(() => {
    if (isOpen && session?.user?.email) {
      fetchNotifications();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700
                   hover:bg-gray-100 focus:outline-none focus:ring-2
                   focus:ring-green-500 rounded-full transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                  {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs hover:bg-gray-100"
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>

          {/* Lista de notificaciones con scroll */}
          <div className="max-h-[450px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No tienes notificaciones</p>
                <p className="text-gray-400 text-sm mt-1">
                  Te avisaremos cuando tengas nuevos anuncios
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      !notification.leido ? "bg-blue-50/50 border-l-4 border-blue-500" : ""
                    }`}
                    onClick={() => !notification.leido && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        !notification.leido ? "bg-blue-500" : "bg-transparent"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm ${
                          !notification.leido ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                        }`}>
                          {notification.titulo}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.mensaje}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <Button
                variant="ghost"
                className="w-full text-sm hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  // router.push("/notifications");
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}