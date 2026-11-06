import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ArtFormBuilderService {

  constructor() { }

  deepGet(obj: any, path: string): any {
    if (!obj || !path) return null;
    return path.split('.').reduce((acc, k) => (acc != null ? acc[k] : null), obj);
  }

  reformatToOptionValues(data: any[]|any, valueKey: string, labelKey: string): { label: string; value: any }[] {
    if (Array.isArray(data)) {
      return data.map(item => ({
        label: this.deepGet(item, labelKey).toString() ?? '',
        value: this.deepGet(item, valueKey).toString()
      }));
    } else if (typeof data === 'object' && data !== null) {
      return [{
        label: this.deepGet(data, labelKey).toString() ?? '',
        value: this.deepGet(data, valueKey).toString()
      }];
    }
    return [];
  }

}
