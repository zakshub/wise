type RouteHandler = (params: Record<string, string>) => Promise<void> | void;

interface Route {
  pattern: RegExp;
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];
  private currentPath: string = '';
  private basePath: string = '';
  
  constructor(basePath: string = '') {
    this.basePath = basePath;
    window.addEventListener('popstate', () => this.handleRoute());
  }
  
  add(path: string, handler: RouteHandler): this {
    const regexPath = path
      .replace(/\/:(\w+)/g, '/(?<$1>[^/]+)')
      .replace(/\//g, '\\/');
    this.routes.push({ pattern: new RegExp(`^${regexPath}$`), handler });
    return this;
  }
  
  navigate(path: string): void {
    const fullPath = this.basePath + path;
    if (fullPath !== this.currentPath) {
      history.pushState(null, '', fullPath);
      this.handleRoute();
    }
  }
  
  private async handleRoute(): Promise<void> {
    const path = window.location.pathname.slice(this.basePath.length) || '/';
    this.currentPath = this.basePath + path;
    
    for (const route of this.routes) {
      const match = path.match(route.pattern);
      if (match) {
        const params = match.groups || {};
        await route.handler(params);
        return;
      }
    }
    
    this.navigate('/');
  }
  
  start(): void {
    this.handleRoute();
  }
}