import {Routes} from "@angular/router";
import { AuthGuard } from './components/login';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'welcome', loadComponent: () => import('./components/welcome').then(m => m.WelcomeComponent), canActivate: [AuthGuard] },
  { path: 'login', loadComponent: () => import('./components/login').then(m => m.LoginComponent) },
  { path: 'teams', loadComponent: () => import('./components/teams-list').then(m => m.TeamsListComponent), canActivate: [AuthGuard] },
  { path: 'teams/new', loadComponent: () => import('./components/teams-create').then(m => m.TeamCreateComponent), canActivate: [AuthGuard] },
  { path: 'teams/:id', loadComponent: () => import('./components/teams-edit/team-edit.component').then(m => m.TeamEditComponent), canActivate: [AuthGuard] },
  { path: 'users', loadComponent: () => import('./components/users/users-list.component').then(m => m.UsersListComponent), canActivate: [AuthGuard] },
  { path: 'users/new', loadComponent: () => import('./components/users/user-create.component').then(m => m.UserCreateComponent), canActivate: [AuthGuard] },
  { path: 'users/:id', loadComponent: () => import('./components/users/user-edit.component').then(m => m.UserEditComponent), canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'login' }
];
