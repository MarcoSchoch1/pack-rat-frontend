import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { AddItem } from './add-item/add-item';
import { ItemDetail } from './item-detail/item-detail';
import { CreateCollection } from './create-collection/create-collection';
import { authGuard } from './service/auth-guard';
import { Register } from './register/register';
import { CollectionsOverview } from './collections-overview/collections-overview';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    {
        path: '',
        canActivateChild: [authGuard],
        children: [
        { path: '', component: CollectionsOverview },
        { path: 'collections/new', component: CreateCollection },
        { path: 'collections/:collectionId', component: Dashboard },
        { path: 'collections/:collectionId/items/new', component: AddItem },
        { path: 'items/:id', component: ItemDetail },
        { path: 'items/:id/edit', component: AddItem },
        ],
    },
    { path: '**', redirectTo: '' }

];
