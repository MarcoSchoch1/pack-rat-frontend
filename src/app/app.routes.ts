import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { AddItem } from './add-item/add-item';
import { ItemDetail } from './item-detail/item-detail';
import { authGuard } from './service/auth-guard';

export const routes: Routes = [
    { path: 'login', component: Login },
    {
        path: '',
        canActivateChild: [authGuard],
        children: [
        { path: '', component: Dashboard },
        { path: 'items/new', component: AddItem },
        { path: 'items/:id', component: ItemDetail },
        ],
    },
    { path: '**', redirectTo: '' }

];
