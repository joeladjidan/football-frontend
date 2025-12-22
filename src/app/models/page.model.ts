export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // current page index
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  pageable?: any;
  sort?: any;
  empty?: boolean;
}

