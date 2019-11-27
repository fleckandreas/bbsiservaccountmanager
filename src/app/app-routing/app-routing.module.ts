import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component'
import { ImportcsvComponent } from '../importcsv/importcsv.component';

const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
    },
    {
        path: 'import',
        component: ImportcsvComponent,
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes,{useHash:true})
    ],
    exports: [
        RouterModule
    ],
    declarations: []
})
export class AppRoutingModule { }
