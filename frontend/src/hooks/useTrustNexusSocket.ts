import { useState, useEffect, useRef, useCallback } from 'react';
import { SecurityEvent, SecurityAlert, BaselineChange, PoisoningState, Identity, WebSocketPayload } from '../types';
import { getWebSocketUrl } from '../services/api';

export function useTrustNexusSocket(onNewEvent?: (payload: WebSocketPayload) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState<SecurityEvent | null>(null);
  const [latestAlert, setLatestAlert] = useState<SecurityAlert | null>(null);
  const [latestChange, setLatestChange] = useState<BaselineChange | null>(null);
  const [currentScenario, setCurrentScenario] = useState<string>('idle');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [liveEvents, setLiveEvents] = useState<SecurityEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      const url = getWebSocketUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketPayload = JSON.parse(event.data);
          if (data.type === 'LIVE_UPDATE' && data.event) {
            setLatestEvent(data.event);
            if (data.scenario) setCurrentScenario(data.scenario);
            if (data.step_index !== undefined) setStepIndex(data.step_index);
            if (data.alert) setLatestAlert(data.alert);
            if (data.baseline_change) setLatestChange(data.baseline_change);

            setLiveEvents(prev => [data.event, ...prev.slice(0, 99)]);

            if (onNewEvent) {
              onNewEvent(data);
            }
          }
        } catch (err) {
          console.error('Error parsing WS frame:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 2 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 2500);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        ws.close();
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
    }
  }, [onNewEvent]);

  useEffect(() => {
    connect();

    // Ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send('PING');
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    latestEvent,
    latestAlert,
    latestChange,
    currentScenario,
    stepIndex,
    liveEvents,
    setLiveEvents
  };
}
