import { Component } from '@angular/core';
import {CommonModule} from "@angular/common";
import { ArtDataListComponent, DataListConfig, FilterPanelConfig, SortState } from '@artis/ui';

export interface ProduitModel {
  _id?: string;
  nom?: string;
  photo?: string;
  prix: number;
  quantite: number;
  date?: Date;
  status?: string;
  boutique: {
    id: string;
    nom: string;
    centre_commercial: { id: string; nom: string };
  };
}

// ── Mock data ─────────────────────────────────────────────────
const MOCK_PRODUITS: ProduitModel[] = [
  {
    _id: '1', nom: 'New Balance 550 - Blanc/Gris', photo: './assets/unity.png',
    prix: 120, quantite: 45, date: new Date('2024-08-17'),
    status: 'actif',
    boutique: { id: 'b1', nom: 'Axios Sport', centre_commercial: { id: 'cc1', nom: 'Mall Ivandry' } },
  },
  {
    _id: '2', nom: 'Air Force One S - 40', photo: './assets/unity.png',
    prix: 95, quantite: 12, date: new Date('2024-07-01'),
    status: 'faible_stock',
    boutique: { id: 'b2', nom: 'Nike Store', centre_commercial: { id: 'cc1', nom: 'Mall Ivandry' } },
  },
  {
    _id: '3', nom: 'Nike Run - 42', photo: './assets/unity.png',
    prix: 85, quantite: 0, date: new Date('2024-04-11'),
    status: 'rupture',
    boutique: { id: 'b1', nom: 'Axios Sport', centre_commercial: { id: 'cc2', nom: 'City Mall' } },
  },
  {
    _id: '4', nom: 'Adidas Ultraboost 24', photo: './assets/unity.png',
    prix: 180, quantite: 8, date: new Date('2024-08-12'),
    status: 'actif',
    boutique: { id: 'b3', nom: 'Adidas Outlet', centre_commercial: { id: 'cc2', nom: 'City Mall' } },
  },
  {
    _id: '5', nom: 'Jordan 1 High OG', photo: './assets/unity.png',
    prix: 220, quantite: 3, date: new Date('2024-06-20'),
    status: 'faible_stock',
    boutique: { id: 'b2', nom: 'Nike Store', centre_commercial: { id: 'cc1', nom: 'Mall Ivandry' } },
  },
  {
    _id: '5', nom: 'Jordan 1 High OG', photo: './assets/unity.png',
    prix: 220, quantite: 3, date: new Date('2024-06-20'),
    status: 'faible_stock',
    boutique: { id: 'b2', nom: 'Nike Store', centre_commercial: { id: 'cc1', nom: 'Mall Ivandry' } },
  },
  {
    _id: '5', nom: 'Jordan 1 High OG', photo: './assets/unity.png',
    prix: 220, quantite: 3, date: new Date('2024-06-20'),
    status: 'faible_stock',
    boutique: { id: 'b2', nom: 'Nike Store', centre_commercial: { id: 'cc1', nom: 'Mall Ivandry' } },
  },
];

@Component({
  selector: 'art-data-list-demo',
  standalone: true,
  imports: [CommonModule, ArtDataListComponent],
  templateUrl: './data-list-demo.component.html',
  styleUrl: './data-list-demo.component.css'
})
export class DataListDemoComponent {
  produits = MOCK_PRODUITS;
  lastEvent: any = null;

  // ── Filter panel config ───────────────────────────────────────
  produitFilterConfig: FilterPanelConfig = {
    fields: [
      // {
      //   key: 'nom',
      //   label: 'Nom du produit',
      //   type: 'text',
      //   placeholder: 'Rechercher un produit...',
      //   colSpan: 6,
      // },
      // {
      //   key: 'status',
      //   label: 'Statut',
      //   type: 'select',
      //   colSpan: 6,
      //   options: [
      //     { value: 'actif',        label: 'Actif' },
      //     { value: 'faible_stock', label: 'Faible stock' },
      //     { value: 'rupture',      label: 'Rupture' },
      //   ],
      // },
      // {
      //   key: 'prix',
      //   label: 'Prix (Ar)',
      //   type: 'numberrange',
      //   colSpan: 6,
      // },
      // {
      //   key: 'quantite',
      //   label: 'Quantité',
      //   type: 'numberrange',
      //   colSpan: 6,
      // },
      // {
      //   key: 'date',
      //   label: 'Date',
      //   type: 'daterange',
      //   colSpan: 12,
      // },
      // {
      //   key: 'boutique.nom',
      //   label: 'Boutique',
      //   type: 'text',
      //   placeholder: 'Nom de la boutique...',
      //   colSpan: 6,
      // },
    ],
  };

  produitListConfig: DataListConfig = {
    title: 'Catalogue Produits',
    subtitle: 'Gestion du stock par boutique',
    layoutMode: 'full',   // 'full' | 'compact' | 'invoice'
    defaultViewMode: 'table',
    showCheckbox: true,
    showActions: true,
    selectedButtonLabel: 'Actions groupées',
    selectedButtonIcon: 'inventory',
    pageSize: 5,
    // MODE LOCAL : le framework filtre, trie et pagine `data` lui-meme (essayez les icones d'en-tete,
    // le panneau de filtres, et un clic sur un badge de statut). Retirez cette ligne pour le mode manuel.
    localMode: true,
    isAutoPagination: true,
    showDefaultCountCard: true,

    // ── Sort fields ──────────────────────────────────────────
    sortFields: [
      { key: 'nom',       label: 'Nom du produit' },
      { key: 'prix',      label: 'Prix' },
      { key: 'quantite',  label: 'Quantité' },
      { key: 'date',      label: 'Date' },
      { key: 'boutique.nom', label: 'Boutique' },
    ],

    // ── Stat cards ───────────────────────────────────────────
    stats: [
      {
        title: 'Valeur totale stock',
        subtitle: 'Prix × Quantité',
        icon: 'payments',
        unit: 'Ar',
        calcMethod: 'custom',
        precision: 0,
        customCalc: (data) => data.reduce((sum, p) => sum + (p.prix * p.quantite), 0).toLocaleString('fr-FR'),
        indicatorValue: 8.2,
        indicatorStyle: 'positive',
      },
      {
        title: 'Prix moyen',
        subtitle: 'Moyenne produits',
        attribute: 'prix',
        calcMethod: 'avg',
        unit: 'Ar',
        precision: 0,
        icon: 'price_check',
      },
      {
        title: 'Stock total',
        subtitle: 'Unités disponibles',
        attribute: 'quantite',
        calcMethod: 'sum',
        unit: 'u.',
        icon: 'inventory_2',
        indicatorValue: -3.5,
        indicatorStyle: 'negative',
      },
    ],

    // ── Columns ──────────────────────────────────────────────
    columns: [
      {
        key: 'produit',
        title: 'Produit',
        sortable: true,
        sortKey: 'nom',
        filterable: { name: 'nom', label: 'Produit', type: 'text' },
        // showInCardHeader: true,
        // cardHeaderAlign: 'left',
        sections: [
          {
            colMd: 1,
            fields: [
              { attribute: 'photo', type: 'image', cssClass: '',style:'max-width:100%;height:auto;object-fit:cover;' },
            ],
          },
          {
            colMd: 10,
            fields: [
              { attribute: 'nom',  type: 'text',   cssClass: 'fw-semibold' },
              { attribute: '_id',  type: 'text',   cssClass: 'text-muted small' },
            ],
          },
        ],
      },
      {
        key: 'boutique',
        title: 'Boutique',
        sortable: true,
        sortKey: 'boutique.nom',
        filterable: { name: 'boutique.nom', label: 'Boutique', type: 'text' },
        sections: [
          {
            fields: [
              { attribute: 'boutique.nom',                   type: 'text', cssClass: 'fw-semibold' },
              { attribute: 'boutique.centre_commercial.nom', type: 'text', cssClass: 'text-muted small' },
            ],
          },
        ],
      },
      {
        key: 'prix',
        title: 'Prix',
        sortable: true,
        filterable: true,
        width: '100px',
        sections: [
          { fields: [{ attribute: 'prix', type: 'number', unit: 'Ar', cssClass: 'fw-bold' }] },
        ],
      },
      {
        key: 'quantite',
        title: 'Stock',
        sortable: true,
        filterable: true,
        width: '90px',
        sections: [
          { fields: [{ attribute: 'quantite', type: 'number', unit: 'u.' }] },
        ],
      },
      {
        key: 'date',
        title: 'Date',
        filterable: true,
        width: '110px',
        showInCardHeader: true,
        cardHeaderAlign: 'left',
        sections: [
          { fields: [{ attribute: 'date', type: 'date', dateFormat: 'dd/MM/yyyy' }] },
        ],
      },
      {
        key: 'status',
        title: 'Statut',
        filterable: true,
        // showInCardHeader: true,
        // cardHeaderAlign: 'right',
        sections: [
          {
            fields: [
              {
                attribute: 'status',
                type: 'badge',
                filterOnClick: true,
                badgeColorMap: {
                  actif:        'var(--art-success)',
                  faible_stock: 'var(--art-warning)',
                  rupture:      'var(--art-danger)',
                },
                badgeDefaultColor: 'var(--art-text-muted)',
              },
            ],
          },
        ],
      },
    ],

    // ── Row actions ──────────────────────────────────────────
    actions: [
      { id: 'edit',      label: 'Modifier',    icon: 'edit' },
      { id: 'duplicate', label: 'Dupliquer',   icon: 'content_copy' },
      { id: 'stock',     label: 'Ajuster stock', icon: 'inventory' },
      { id: 'delete',    label: 'Supprimer',   icon: 'delete_outline', variant: 'danger', dividerBefore: true },
    ],

    // ── Custom toolbar buttons ────────────────────────────────
    toolbarButtons: [
      { id: 'add',    label: 'Ajouter',  icon: 'add',    variant: 'primary' },
      { id: 'import', label: 'Importer', icon: 'upload', variant: 'default' },
    ],
  };

  // ── Handlers ─────────────────────────────────────────────────

  onFilter(values: Record<string, any>): void {
    this.lastEvent = { type: 'filter', values };
    // Mode local : rien a faire, la liste est deja filtree. En mode manuel, filtrer `produits` ici.
  }

  onSort(sorts: SortState[]): void {
    this.lastEvent = { type: 'sort', sorts };
  }

  onAction(e: { actionId: string; row: any }): void {
    this.lastEvent = { type: 'action', ...e };
    if (e.actionId === 'delete') {
      this.produits = this.produits.filter(p => p._id !== e.row._id);
    }
  }

  onSelection(rows: any[]): void {
    this.lastEvent = { type: 'selection', count: rows.length, ids: rows.map(r => r._id) };
  }

  onPage(e: any): void {
    this.lastEvent = { type: 'page', ...e };
    // If isAutoPagination=false: fetch page data from API here
  }

  onToolbar(id: string): void {
    this.lastEvent = { type: 'toolbar', buttonId: id };
  }
}
