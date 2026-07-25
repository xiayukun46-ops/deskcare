import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-white px-6 text-center select-none">
          <span className="text-4xl mb-3">:(</span>
          <p className="text-sm font-semibold text-gray-700 mb-1">应用遇到了一点问题</p>
          <p className="text-xs text-gray-400 mb-4">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-sage-500 text-white text-xs font-medium hover:bg-sage-600 transition-colors">
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}