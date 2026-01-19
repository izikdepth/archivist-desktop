import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import '../styles/Logs.css';

function Logs() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logPath, setLogPath] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [lineCount, setLineCount] = useState(500);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsViewerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const logLines = await invoke<string[]>('get_node_logs', { lines: lineCount });
      setLogs(logLines);
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e instanceof Error ? e.message : 'Failed to fetch logs');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lineCount]);

  const fetchLogPath = async () => {
    try {
      const path = await invoke<string>('get_node_log_path');
      setLogPath(path);
    } catch (e) {
      console.error('Failed to fetch log path:', e);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchLogPath();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  // Auto-scroll to bottom when logs change and auto-scroll is enabled
  useEffect(() => {
    if (autoScroll && !loading) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, loading]);

  // Detect manual scroll and disable auto-scroll if user scrolls up
  useEffect(() => {
    const logsViewer = logsViewerRef.current;
    if (!logsViewer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = logsViewer;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;

      // If user scrolls away from bottom, disable auto-scroll
      // If user scrolls back to bottom, re-enable it
      if (!isAtBottom && autoScroll) {
        setAutoScroll(false);
      } else if (isAtBottom && !autoScroll && autoRefresh) {
        setAutoScroll(true);
      }
    };

    logsViewer.addEventListener('scroll', handleScroll);
    return () => logsViewer.removeEventListener('scroll', handleScroll);
  }, [autoScroll, autoRefresh]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScroll(true); // Re-enable auto-scroll when manually scrolling to bottom
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyAllLogs = () => {
    const allLogs = logs.join('\n');
    navigator.clipboard.writeText(allLogs);
  };

  return (
    <div className="logs-container">
      <header className="logs-header">
        <div>
          <h1>Node Logs</h1>
          <p className="log-path">Log file: {logPath || 'Loading...'}</p>
        </div>
        <div className="logs-controls">
          <label className="control-item">
            <span>Lines:</span>
            <select
              value={lineCount}
              onChange={(e) => setLineCount(Number(e.target.value))}
            >
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={5000}>5000</option>
            </select>
          </label>
          <label className="control-item checkbox">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh</span>
          </label>
          <label className="control-item checkbox">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>Auto-scroll</span>
          </label>
          <button onClick={fetchLogs} disabled={loading} className="btn-secondary">
            Refresh
          </button>
          <button onClick={scrollToBottom} className="btn-secondary">
            Scroll to Bottom
          </button>
          <button onClick={copyAllLogs} disabled={logs.length === 0} className="btn-secondary">
            Copy All
          </button>
          <button onClick={clearLogs} disabled={logs.length === 0} className="btn-danger">
            Clear Display
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading logs...</div>
      ) : (
        <div className="logs-viewer" ref={logsViewerRef}>
          {logs.length === 0 ? (
            <div className="empty-logs">No logs available. Start the node to generate logs.</div>
          ) : (
            logs.map((line, index) => (
              <div key={index} className="log-line">
                <span className="log-line-number">{index + 1}</span>
                <span className="log-line-content">{line}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}

export default Logs;
