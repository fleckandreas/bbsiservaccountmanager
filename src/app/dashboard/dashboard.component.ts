import { Component, OnInit, ViewChild, AfterViewInit,AfterContentInit, OnDestroy } from '@angular/core';
import { DataConnectorService, Workspace } from '../data-connector.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort, MatTableDataSource, MatPaginator } from '@angular/material';

declare var require: any
var csvjson = require('csvjson');



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort ,{static:false}) sort: MatSort;
  @ViewChild(MatPaginator,{static:false}) paginator: MatPaginator;
  tabindex = 0;
  columnsToDisplay: string[] = ['NNAME', 'VNAME', 'GEBDAT', 'KL_NAME'];
  dataSource: MatTableDataSource<any> = null;
  expandedElement: any | null;
  workspace:Workspace;
  
  constructor(private dataconnector: DataConnectorService) {
    //this.options=this.dataconnector.options;
    this.sub = this.dataconnector.worspace$.subscribe(workspace=>{
      if(workspace){
      this.workspace = workspace;
      this.raw = workspace.schueler;
      this.initTable(this.workspace.schueler);               
    }
    })
    
  }
 /* applyChanges() {
    this.workspace.schueler.forEach(e => {
      e.Kurse = this.dataconnector.getKurse(e);
    })
  }*/
  checkAccounts(){    
    this.initTable(  this.raw.filter(a=>{return !(a.Account != '' && a.Passwort !='') }));
   }
   allAccounts(){
     this.initTable(  this.workspace.schueler);
   }
  selectedTab($event) {
    console.log($event);
    if ($event === 0) {
      
      this.initTable(this.raw)
    } else {
      this.initTable([])
    }
  }
  initTable(data){
    console.log("Set data" + data.length)

    // this.dataSource = null;
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    if(this.paginator){
      this.paginator.pageIndex = 0;
    }
    
  }
    sub;
    ngOnDestroy(){
      if (this.sub) { this.sub.unsubscribe() }
    }
    raw:Array<any>
    ngAfterViewInit(){
      
     
    }
    ngOnInit() {
      //Test
      return;
      let test = false;
      if (test) {
        let str = "Müllerdergebuaer , van (FRE) van der /ABC.68 geb. Baum ";
        //let grestr = "/(?:[\s]|^)(" + this.options.removeNamenzusatz + ")(?=[\s]|$)/gim";
        let news = str;
        /*
        this.options.removePattern.split(";").forEach(s => {
          let reg = new RegExp(s, "gim");
          news = news.replace(reg, " ").trim();
        })
    
        this.options.replaceUnderscorePattern.split(";").forEach(s => {
          let reg2 = new RegExp(s, "gim");
    
          news = news.replace(reg2, "_").trim();
        })
    */
        news = news.replace(new RegExp("[ ]{2,}", "gim"), " ");
        console.log(news)
      }



    }
changeAccount(element: any, selected) {
    console.log(element, selected)
    element.existing = selected;
  }



  myTrackById(i, e) {
    return e.id;
  }
   
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  

}
