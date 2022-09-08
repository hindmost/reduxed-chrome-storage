import { Store, Action, AnyAction, compose } from 'redux';

export type ActionExtension =  ReturnType<typeof compose>;

export interface ExtendedDispatch<A extends Action = AnyAction> {
  (action: A | ActionExtension, ...extraArgs: any[]): any
}

export interface ExtendedStore extends Store {
  dispatch: ExtendedDispatch;
}

export interface StoreCreatorContainer {
  (preloadedState?: any): Store;
}