import React from 'react';
import ProfessorTabs from "./ProfessorTabs";
import UserTabs from "./UserTabs";
import AdminTabs from "./AdminTabs";
import ModeradorTabs from "./ModeradorTabs";

export default function AppStack({ perfil }: { perfil: string }) {
  let TabsComponent;

  switch (perfil) {
    case 'professor':
      TabsComponent = ProfessorTabs;
      break;
    case 'administrador':
      TabsComponent = AdminTabs;
      break;
    case 'moderador':
      TabsComponent = ModeradorTabs;
      break;
    default:
      TabsComponent = UserTabs;
  }

  return <TabsComponent />;
}