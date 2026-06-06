import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1F0E08] text-[#FAF4EC] flex flex-col items-center justify-center p-6 selection:bg-[#E67E22] selection:text-white font-sans">
          <div className="max-w-md w-full bg-[#FAF4EC] text-[#2D1309] p-8 rounded-lg border-4 border-[#C0392B] shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#C0392B]" />
            <div className="text-center space-y-4">
              <span className="text-4xl">🌵</span>
              <h2 className="font-display font-extrabold text-2xl text-[#C0392B] uppercase tracking-tight">Ocorreu um erro!</h2>
              <p className="text-xs text-[#2D1309]/80 leading-relaxed">
                Tivemos uma interrupção inesperada ao iniciar do feed de satisfação.
              </p>
              
              <div className="bg-[#FCF9F5] p-3 rounded border border-red-200 text-left overflow-auto max-h-48 font-mono text-[10px] text-red-700 whitespace-pre-wrap">
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[#C0392B] hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded transition-all cursor-pointer text-xs uppercase tracking-wide"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
