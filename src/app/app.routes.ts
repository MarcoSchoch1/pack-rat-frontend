import { Component } from '@angular/core';
import { Routes } from '@angular/router';

export const routes: Routes = [
    //TODO add components to routes
    { path: '/login', component: Component},
    { path: '', component: Component},
    { path: '/items/new', component: Component},
    { path: '/items:id', component: Component},

];
