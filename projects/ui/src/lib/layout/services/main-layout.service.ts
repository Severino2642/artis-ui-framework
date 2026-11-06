import {Injectable, signal} from "@angular/core";

@Injectable({providedIn:'root'})
export class ArtMainLayoutService {
    pageTitle= signal<string>('');
    setPageTitle(title: string) {
        this.pageTitle.set(title);
    }

    getPageTitle() {
        return this.pageTitle();
    }
}
