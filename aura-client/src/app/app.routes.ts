import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Residents } from './residents/residents';
import { Vehicular } from './vehicular/vehicular';
import { Pedestrian } from './pedestrian/pedestrian';
import { Finance } from './finance/finance';
import { Gatehouse } from './gatehouse/gatehouse';
import { IncidentList } from './incident-list/incident-list';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Login } from './auth/login/login';
import { ListOfServices } from './list-of-services/list-of-services';
import { Profile } from './profile/profile';

export const routes: Routes = [
  { path: 'login', component: Login },
  { 
    path: '', 
    component: MainLayout, 
    children: [
      { path: '', component: Dashboard },
      { path: 'residents', component: Residents },
      { path: 'pedestrians', component: Pedestrian },
      { path: 'vehiculars', component: Vehicular },
      { path: 'finance', component: Finance },
      { path: 'gatehouse', component: Gatehouse },
      { path: 'incidents-list', component: IncidentList },
      { path: 'list-of-services', component: ListOfServices },
      { path: 'profile', component: Profile },
    ]
  } 
]; 