export interface TripEntry {
  id:               string;
  slug:             string;
  thumb:            string;
  banner:           string;
  title:            string;
  meta:             string;        // combined "3 h · Location" (kept for compat)
  duration:         string;        // "3 h"
  location:         string;        // "City Centre"
  tags:             string[];
  body:             string;        // short description (fallback for drawer)
  longDescription?: string;        // full description shown in drawer
  highlights?:      string[];      // "What we'll see" bullets
  price?:           number;        // numeric EUR price
  group?:           string;        // "1–8 people"
  badge?:           string;        // display string: "Most booked", "Seasonal", …
  gallery?:         string;        // gallery folder key (for future real photos)
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
