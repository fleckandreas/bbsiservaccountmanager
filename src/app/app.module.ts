import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http'
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AppRoutingModule } from './app-routing/app-routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';

import { MatButtonModule, MatDialogModule, MatListModule, MatProgressBarModule } from '@angular/material';
import {MatTabsModule} from '@angular/material/tabs';
import {MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {MatSelectModule} from '@angular/material/select';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBarModule,MAT_SNACK_BAR_DEFAULT_OPTIONS} from '@angular/material/snack-bar';

import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { DataConnectorService } from './data-connector.service';
import { ImportcsvComponent } from './importcsv/importcsv.component';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ElectronService } from './core/services/electron/electron.service';


// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ImportcsvComponent
     
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }}),
    MatButtonModule, MatPaginatorModule,MatSelectModule,MatIconModule,MatCheckboxModule,MatSnackBarModule,
    MatDialogModule, MatListModule, MatProgressBarModule,MatTabsModule,MatInputModule,MatTableModule,MatSortModule,MatMenuModule,
    FlexLayoutModule
  ],
  providers: [DataConnectorService, {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500}},ElectronService],
  bootstrap: [AppComponent]
})
export class AppModule { }
