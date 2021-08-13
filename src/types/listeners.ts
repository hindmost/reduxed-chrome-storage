import { ExtendedStore } from './store';

export type ChangeListener = (store: ExtendedStore, oldState?: any) => void;

export type ErrorListener = (message: string, exceeded: boolean) => void;
