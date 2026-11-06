import { Component } from '@angular/core';
import {CommonModule} from "@angular/common";
import { ArtDetailViewComponent, DetailButtonEvent, DetailViewConfig } from '@artis/ui';

// ── Domain model ──────────────────────────────────────────────
export interface ProduitModel {
  _id?: string;
  urlVersWebsite: string;
  nom?: string;
  description?: string;
  photo?: string;
  prix: number;
  quantite: number;
  date?: Date;
  status?: string;
  categorie: { id: string; nom: string }[];
  boutique: {
    id: string; nom: string;
    centre_commercial: { id: string; nom: string };
  };
}

// ── Mock data ─────────────────────────────────────────────────
const PRODUIT: ProduitModel = {
  _id:            'PRD-00124',
  urlVersWebsite: 'https://shop.example.com/produits/nb-550',
  nom:            'New Balance 550 — Blanc/Gris',
  description:    'Sneaker rétro inspirée du basketball des années 80. Tige en cuir véritable, semelle intermédiaire EVA pour un amorti optimal. Design intemporel adapté au streetwear contemporain.',
  photo:          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  prix:           120000,
  quantite:       45,
  date:           new Date('2024-08-17'),
  status:         'actif',
  categorie: [
    { id: 'cat1', nom: 'Chaussures' },
    { id: 'cat2', nom: 'Sneakers'   },
    { id: 'cat3', nom: 'Sport'      },
    { id: 'cat4', nom: 'New Balance'},
  ],
  boutique: {
    id: 'b1',
    nom: 'Axios Sport',
    centre_commercial: { id: 'cc1', nom: 'Mall Ivandry' },
  },
};

@Component({
  selector: 'art-detail-view-demo',
  standalone: true,
  imports: [CommonModule, ArtDetailViewComponent],
  templateUrl: './detail-view-demo.component.html',
  styleUrl: './detail-view-demo.component.css'
})
export class DetailViewDemoComponent {
  produit: ProduitModel = PRODUIT;
  lastEvent: any = null;

  produitDetailConfig: DetailViewConfig = {
    cards: [

      // ════════════════════════════════════════════════════
      // CARD 1 — Aperçu général + photo
      // ════════════════════════════════════════════════════
      {
        id: 'general',
        title: 'Informations générales',
        subtitle: 'Identité et disponibilité du produit',
        icon: 'info',
        collapsed: false,
        showEditButton: true,
        showDeleteButton: true,
        extraButtons: [
          {
            id: 'duplicate',
            label: 'Dupliquer',
            icon: 'content_copy',
            variant: 'default',
            position: 'left',
          },
          {
            id: 'preview',
            label: 'Aperçu',
            icon: 'visibility',
            variant: 'default',
            position: 'left',
          },
        ],
        sections: [
          {
            // Section 1: Photo + Identité (2 colonnes)
            gridCols: '25% 70%',
            columns: [
              {
                // Colonne gauche: photo
                title: 'Photo',
                sectionColumns: [
                  {
                    colMd: 12,
                    fields: [
                      {
                        attribute: 'photo',
                        type: 'image',
                        // label: 'Photo',
                        cssClass: '',
                        style: 'width:100%;object-fit:cover',
                      },
                    ],
                  },
                ],
              },
              {
                // Colonne droite: identité
                title: 'Identité',
                sectionColumns: [
                  {
                    colMd: 10,
                    fields: [
                      { attribute: 'nom',         label: 'Nom',           type: 'text',   cssClass: 'dc-value fw-bold fs-6' },
                      { attribute: 'description', label: 'Description',   type: 'text',   cssClass: 'dc-value text-muted small' },
                      {
                        attribute: 'urlVersWebsite',
                        label:     'Lien produit',
                        type:      'link',
                        linkHref:  '@urlVersWebsite',
                        linkTarget: '_blank',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            // Section 2: Prix, Stock, Date, Statut (4 colonnes)
            gridCols: 4,
            columns: [
              {
                title: 'Prix',
                sectionColumns: [{
                  colMd: 12,
                  fields: [{ attribute: 'prix', type: 'number', unit: 'Ar', cssClass: 'dc-value fw-bold' }],
                }],
              },
              {
                title: 'Stock',
                sectionColumns: [{
                  colMd: 12,
                  fields: [{ attribute: 'quantite', type: 'number', unit: 'u.', cssClass: 'dc-value' }],
                }],
              },
              {
                title: 'Date d\'ajout',
                sectionColumns: [{
                  colMd: 12,
                  fields: [{ attribute: 'date', type: 'date', dateFormat: 'dd/MM/yyyy', cssClass: 'dc-value' }],
                }],
              },
              {
                title: 'Statut',
                sectionColumns: [{
                  colMd: 12,
                  fields: [{
                    attribute: 'status',
                    type: 'badge',
                    badgeStyle: 'outline',
                    badgeColorMap: {
                      actif:        '#16A34A',
                      faible_stock: '#D97706',
                      rupture:      '#DC2626',
                      inactif:      '#78716C',
                    },
                    badgeDefaultColor: '#78716C',
                  }],
                }],
              },
            ],
          },
        ],
      },

      // ════════════════════════════════════════════════════
      // CARD 2 — Catégories
      // ════════════════════════════════════════════════════
      {
        id: 'categories',
        title: 'Catégories',
        subtitle: 'Classements du produit',
        icon: 'label',
        collapsed: false,
        showEditButton: true,
        showDeleteButton: false,
        extraButtons: [
          {
            id: 'manage-categories',
            label: 'Gérer les catégories',
            icon: 'category',
            variant: 'default',
            position: 'left',
          },
        ],
        sections: [
          {
            gridCols: 1,
            columns: [
              {
                sectionColumns: [{
                  colMd: 12,
                  fields: [{
                    attribute:  'categorie',
                    type:       'multibadge',
                    displayKey: 'nom',     // display categorie[i].nom
                    label:      'Tags catégories',
                  }],
                }],
              },
            ],
          },
        ],
      },

      // ════════════════════════════════════════════════════
      // CARD 3 — Boutique
      // ════════════════════════════════════════════════════
      {
        id: 'boutique',
        title: 'Boutique',
        subtitle: 'Point de vente et emplacement',
        icon: 'storefront',
        collapsed: false,
        showEditButton: false,
        showDeleteButton: false,
        extraButtons: [
          {
            id: 'view-boutique',
            label: 'Voir la boutique',
            icon: 'open_in_new',
            variant: 'primary',
            position: 'right',
          },
        ],
        sections: [
          {
            gridCols: 2,
            columns: [
              {
                title: 'Boutique',
                sectionColumns: [
                  {
                    // colMd: 6,
                    fields: [
                      { attribute: 'boutique.id',  label: 'ID',   type: 'text', cssClass: 'dc-value text-muted small' },
                    ],
                  },
                  {
                    // colMd: 6,
                    fields: [
                      { attribute: 'boutique.nom',  label: 'Nom',  type: 'text', cssClass: 'dc-value fw-semibold' },
                    ],
                  },
                ],

              },
              {
                title: 'Centre commercial',
                sectionColumns: [
                  {
                    colMd: 12,
                    fields: [
                      { attribute: 'boutique.centre_commercial.id',  label: 'ID',  type: 'text', cssClass: 'dc-value text-muted small' },
                      { attribute: 'boutique.centre_commercial.nom', label: 'Nom', type: 'text', cssClass: 'dc-value fw-semibold' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },

      // ════════════════════════════════════════════════════
      // CARD 4 — Identifiant système (collapsed by default)
      // ════════════════════════════════════════════════════
      {
        id: 'system',
        title: 'Informations système',
        subtitle: 'Données techniques internes',
        icon: 'settings',
        collapsed: true,                 // collapsed par défaut
        showEditButton: false,
        showDeleteButton: false,
        sections: [
          {
            gridCols: 2,
            columns: [
              {
                title: 'Identifiant',
                sectionColumns: [{
                  colMd: 12,
                  fields: [
                    { attribute: '_id', label: 'ID MongoDB', type: 'text', cssClass: 'dc-value' },
                  ],
                }],
              },
              {
                title: 'Référence web',
                sectionColumns: [{
                  colMd: 12,
                  fields: [
                    {
                      attribute:  'urlVersWebsite',
                      label:      'URL complète',
                      type:       'link',
                      linkHref:   '@urlVersWebsite',
                      linkTarget: '_blank',
                    },
                  ],
                }],
              },
            ],
          },
        ],
      },

    ],
  };

  // ── Handler ───────────────────────────────────────────────────
  onButton(event: DetailButtonEvent): void {
    this.lastEvent = event;

    switch (event.buttonId) {
      case '__edit':
        console.log('✏️ Modifier le produit', event.data._id);
        break;
      case '__delete':
        console.log('🗑️ Supprimer le produit', event.data._id);
        break;
      case 'duplicate':
        console.log('📋 Dupliquer le produit', event.data._id);
        break;
      case 'preview':
        window.open(event.data.urlVersWebsite, '_blank');
        break;
      case 'view-boutique':
        console.log('🏪 Naviguer vers boutique', event.data.boutique?.id);
        break;
      case 'manage-categories':
        console.log('🏷️ Gérer les catégories');
        break;
    }
  }
}
