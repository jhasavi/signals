declare module 'postgres' {
  interface Sql {
    join(fragments: any[], separator: any): any;
  }
}

export {};
