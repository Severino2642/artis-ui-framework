export interface NavbarItemModel {
  id: string;
  idmere?: string;  // ID du parent, null si c'est un item de premier niveau
  nom: string;
  icon: string;
  route: string;
  order: number;
  niveau: number;  // Niveau de profondeur dans la hiérarchie (0 pour les items de premier niveau)
  badge_value?: number;  // Valeur du badge associée à cet item (ex: nombre de notifications)
  badge_color?: string;  // Couleur du badge (ex: "red", "blue", "green")
}

export interface NavbarItemCPLModel extends NavbarItemModel {
  isActive?: boolean;  // Indique si cet item est actif (true) ou non (false)
  mere?: NavbarItemCPLModel;  // Référence à l'item parent, null si c'est un item de premier niveau
  filles?: NavbarItemCPLModel[];
}
