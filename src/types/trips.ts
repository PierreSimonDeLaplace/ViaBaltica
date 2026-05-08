export interface TripEntry {
  id:     string;
  thumb:  string;
  banner: string;
  title: string;
  meta:  string;
  tags:  string[];
  body:  string;
  price?:   string;
  badge?:   'bestseller' | 'hot' | 'promo';
  gallery?: string;
}

export interface TripCategoryLang {
  title:    string;
  subtitle: string;
  trips:    TripEntry[];
}

export interface TripCategoryFile {
  photo: string;
  en:    TripCategoryLang;
  pl:    TripCategoryLang;
}
