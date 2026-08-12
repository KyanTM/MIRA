import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
