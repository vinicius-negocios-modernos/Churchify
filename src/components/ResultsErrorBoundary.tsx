import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultsErrorBoundaryProps {
  children: ReactNode;
}

interface ResultsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ResultsErrorBoundary extends Component<ResultsErrorBoundaryProps, ResultsErrorBoundaryState> {
  constructor(props: ResultsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ResultsErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ResultsErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800">
            Falha ao exibir conteudo gerado
          </h3>
          <p className="text-sm text-red-600">
            Ocorreu um erro ao renderizar os resultados. Tente novamente.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
