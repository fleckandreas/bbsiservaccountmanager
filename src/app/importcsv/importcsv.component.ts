import { Component, OnInit, ViewChild } from '@angular/core';
import { DataConnectorService, Workspace } from '../data-connector.service';
import { MatSort, MatTableDataSource, MatPaginator } from '@angular/material';

declare var require: any

var csvjson = require('csvjson');
const uuidv4 = require('uuid/v4');

@Component({
  selector: 'app-importcsv',
  templateUrl: './importcsv.component.html',
  styleUrls: ['./importcsv.component.css']
})
export class ImportcsvComponent implements OnInit {
  @ViewChild(MatSort,{static:false}) sort: MatSort;
  @ViewChild(MatPaginator,{static:false}) paginator: MatPaginator;
  workspace:Workspace;
  bbsaccounts = "";
  result: any;
  options: any;
  dataSource;
  dataSourceFound;
  tabindex = 0;
  displayedColumns = ["changes", "userbbs", "useraccounts", "changeuser", "isnew"]
  displayedColumnsFound = ["NNAME", "VNAME", "GEBDAT", "KL_NAME"];

  untisUnterricht = '';
  untisLehrer = '';
  lehrer = [];
  iservaccounts = '';

  reorg=false;
  constructor(private dataconnector: DataConnectorService) { }

  ngOnInit() {
    this.dataconnector.worspace$.subscribe(workspace=>{
      if(workspace){
        this.options = workspace.options;
        this.workspace = workspace;
      }
    });
  }
  changed = [];
  unchanged = [];
  notfound = [];
  replaceIDs() {
    const csvoptions = {
      delimiter: ';',
      quote: '"',
    };
    const iservData = csvjson.toObject(this.iservaccounts, csvoptions);
    const schuelerList = [];
    this.workspace.schueler.forEach(e => {
      if (!schuelerList.find(el => el.id === e.id)) {
        schuelerList.push(e);
      }
    });
   
    iservData.forEach(element => {
    
      schuelerList.forEach(schueler => {
        
        if (schueler.Account === element.Account || (schueler.NNAME === element.AccountNName && schueler.VNAME === element.AccountVName && schueler.KL_NAME === element.KL_NAME)) {
         
          if (schueler.id !== element.id) {
            console.log('finde' + schueler.NNAME + '##' + element.AccountNName);
            console.log('alte id ' + schueler.id + ' neue id ' + element.id);
            schueler.id = element.id;
            element.changed = true;

            this.changed.push(element);
          } else {
            element.changed = false;
            this.unchanged.push(element);
          }

        }
      });
    });
    this.notfound = iservData.filter(d => d.changed === undefined)
    this.workspace.schueler=schuelerList;
    this.dataconnector.worspace$.next(this.workspace);
  }
  importlehrer() {
      this.workspace.lehrer = this.lehrer.slice(0,this.lehrer.length);
      this.dataconnector.sendUserMessage('Import Lehrer abgeschlossen, Speichern nicht vergessen!');
      this.lehrer=[];  
  }
  importUntisLehrer() {
    const headersU = [];
    const headersL = [];
    for (let i = 0; i < 45; i++) {
      headersU.push(i.toString())
    }
    for (let i = 0; i < 43; i++) {
      headersL.push(i.toString())
    }
    const csvoptionsUnterricht = {
      delimiter: ';',
      quote: '"',
      headers: headersU

    };
    
    const csvoptionsLehrer = {
      delimiter: ';',
      quote: '"',
      headers: headersL

    };
    const untisUnterrichtJSON = csvjson.toObject(headersU.join(";") + '\n' + this.untisUnterricht, csvoptionsUnterricht);
    const untisLehrerJSON = csvjson.toObject(headersL.join(";") + '\n' + this.untisLehrer, csvoptionsLehrer);
    this.lehrer = [];
    untisLehrerJSON.forEach(element => {
      if (element[0] !== '' && element[1] !== '') {
        const le = {
          id: element[0].toString().trim(),
          Kurz: element[0].toString().trim(),
          NNAME: element[1].toString().trim(),
          VNAME: element[28].toString().trim(),
          Klassen: '',
          Kurse: '',
          AccountNName: '',
          AccountVName: '',
        };
        le.AccountNName = this.dataconnector.getAccountNNAME(le);
        le.AccountVName = this.dataconnector.getAccountVNAME(le);
       
        const klassen = [];
        untisUnterrichtJSON.forEach(unterricht => {
          if (unterricht[4] !== '') {
            const klasse = unterricht[4].toString().replace(' ', '').replace('/', '_');
            if (unterricht[5] === le.Kurz) {
              if (!klassen.find(k => k === klasse)) {
                klassen.push(klasse);
              }
            }
          }
        });
        le.Klassen = klassen.join(';');
        if(le.VNAME !== ''){
          this.lehrer.push(le);
        }
      }
    });
    this.untisUnterricht='';
    this.untisLehrer='';
    this.dataconnector.sendUserMessage("Vorschauimport abgeschlossen");
      setTimeout(() => {
        this.selectedIndex2 = 5;
      }, 1);
  }


  buildDataSource(event) {
    console.log(event);
    if (event.index == 1) {
      this.dataSource = null;
      this.dataSource = new MatTableDataSource(this.result.foundWithChanges);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
    if (event.index == 2) {
      this.dataSource = null;
      this.dataSource = new MatTableDataSource(this.result.found.map(d => { return d.existing }));
       this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  }
  initTable() {
    /*this.dataSource = null;
    this.dataSource = new MatTableDataSource(this.result.foundWithChanges);
    this.dataSource.sort = this.sort;*/
  }

  setAccountToNew(el) {
    console.log(el)
    this.result.foundWithChanges = this.result.foundWithChanges.filter(f => f != el);
    this.result.notfound.push(el.import);
    console.log(this.result);
  }
  async applyImportBbs(): Promise<any> {
    //generate New bbsaccounts
    let l = await new Promise((resolve, reject) => {
      let tmpAccounts = [];
      this.result.found.forEach(element => {
        const existing: any = element.existing;
        const importd: any = element.import;
        existing.NNAME = importd.NNAME;
        existing.VNAME = importd.VNAME;
        existing.GEBDAT = importd.GEBDAT;
        existing.BBSID = importd.ID;
        existing.Kurse = this.dataconnector.getKurse(importd);
        existing.KL_NAME = importd.KL_NAME;
        existing.AccountNName = this.dataconnector.getAccountNNAME(importd),
        existing.AccountVName = this.dataconnector.getAccountVNAME(importd),
        tmpAccounts.push(existing);
      });
      this.result.notfound.forEach(e => {
        const newE = {
          id: uuidv4(),
          NNAME: e.NNAME,
          VNAME: e.VNAME,
          GEBDAT: e.GEBDAT,
          KL_NAME: e.KL_NAME,
          BBSID: e.ID,
          Kurse: this.dataconnector.getKurse(e),
          AccountNName: this.dataconnector.getAccountNNAME(e),
          AccountVName: this.dataconnector.getAccountVNAME(e),
          Account: "",
          Passwort: this.dataconnector.getPasswort(e)
        };
        tmpAccounts.push(newE);
      });

      this.result.foundWithChanges.forEach(element => {
        const existing: any = element.existing;
        const importd: any = element.import;
        existing.NNAME = importd.NNAME;
        existing.VNAME = importd.VNAME;
        existing.GEBDAT = importd.GEBDAT;
        existing.Kurse = this.dataconnector.getKurse(importd);
        existing.KL_NAME = importd.KL_NAME;
        existing.BBSID = importd.ID;
        existing.AccountNName = this.dataconnector.getAccountNNAME(importd),
          existing.AccountVName = this.dataconnector.getAccountVNAME(importd),
          tmpAccounts.push(existing);
      });

      this.workspace.schueler = tmpAccounts;
      this.result = null;

    })
    this.dataconnector.sendUserMessage("Import Schüler abgeschlossen, Speichern nicht vergessen!")
    alert("Fertig");
  }
  selectedIndex2 = 0;


  importBbs() {
    
    let csvoptions = {
      delimiter: ';', // optional
      quote: '"' // optional
    };
    let importAccount = csvjson.toObject(this.bbsaccounts, csvoptions);
    this.bbsaccounts = "";
    new Promise((resolve, reject) => {
      let e = this.checkAccounts2(importAccount, this.workspace.schueler);
      resolve(e);
    }).then(e => {
      console.log("ALL DONE")
      console.log(e)

      this.result = e;
     
      this.dataconnector.sendUserMessage("Vorschauimport abgeschlossen");
      setTimeout(() => {
        this.selectedIndex2 = 2;
      }, 1);

    })



  }
  myTrackById(i, e) {
    return e.id;
  }
  private checkAccounts2(importAccounts: Array<any>, existAccounts: Array<any>) {
    let columns = this.options.BBSImportColumns.split(",");

    let found = [];
    let foundWithChanges = [];
    
    let tmp = [];
    let usedExisting = [];
    let notfound = [];
    //KURS Korrektur 
    importAccounts.forEach(d => {
      if (d.Kurse) {
        d.Kurse = this.dataconnector.getKurse(d);
      }
    });
    //Fast ID -->BBSID
    const fast = !this.reorg;
    console.log(fast);
    if (fast) {
      importAccounts.forEach(element => {
        const existing = existAccounts.find(e => e.BBSID === element.ID);
        if (existing) {
          console.log("existing");
          found.push({ id: existing.id, import: element, existing: existing, changes: 'fast' });
        } else {
          console.log("new");
          notfound.push(element);
        }
      });
    } else {
       notfound = importAccounts;
      for (let i = columns.length; i > 0; i--) {
        tmp = notfound.slice(0, notfound.length);
        notfound = [];
        console.log("look in " + tmp.length)
        tmp.forEach(element => {
          let changes = [];
          let existing = existAccounts.find(k => {
            if (usedExisting.find(e => k === e) != null) {
              return false;
            }
            let findcount = 0;
            changes = [];
            columns.forEach(c => {
              if (k[c] == element[c]) {
                findcount++;
              } else {
                changes.push(c);
              }
            });
            return findcount == i;
          });
          if (existing && changes.length <=2) {
            if (i == columns.length) {
              found.push({ id: existing.id, import: element, existing: existing, changes: changes.join(",") });
            } else {
              const chstr = changes.join(",");
              if (chstr.search("GEBDAT") > -1 && (chstr.search("NNAME") > -1 || chstr.search("VNAME") > -1)) {
                notfound.push(element);
              } else {
                foundWithChanges.push({ id: existing.id, import: element, existing: existing, changes: chstr });
              }

            }

            usedExisting.push(existing);
          } else {
            notfound.push(element);
          }
        })
      }
    }


    usedExisting = null;
    importAccounts = null;
    return { found: found, foundWithChanges: foundWithChanges, notfound: notfound }

  }
  noIServMatch=[];
  accounts='';
  importIServ() {

    let csvoptions = {
      delimiter: ',', // optional
      quote: '"' // optional
    };
    
    const importIServAccount = csvjson.toObject(this.accounts, csvoptions);
    this.noIServMatch = [];
    let used = [];
    let foundItems = 0;
    importIServAccount.forEach(IServelement => {
      let found = false;

      this.workspace.schueler.forEach(element => {
        if (used.find(e => element === e) == null && IServelement.Nachname == element.AccountNName && IServelement.Vorname == element.AccountVName && IServelement['Klasse/Information'] ===  element.KL_NAME) {
          if(element.Account === '') {element.Account = IServelement.Account;}
          if(element.Passwort === '') {element.Passwort = IServelement.Passwort;}
          found = true;
          used.push(element);
          console.log(element);
          foundItems++;
        }
      });
      if (!found) {
        this.noIServMatch.push(IServelement);
      }
    });
    alert(foundItems + " aktualisiert. Speichern nicht vergessen!");
  }
  failed=[];
  checkAccounts(){
    this.failed=[];
     this.workspace.schueler.forEach(element => {
     const accA = element.Account.split('.');
     const accNName = (element.AccountNName as string).toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/é/g,'e');
      if( element.Account === '' ||  accNName !== accA[accA.length-1]){
        console.log(accA[accA.length-1])    ;
        console.log(accNName);
        this.failed.push(element);
      }
    });
    console.log(this.failed );
  }

}
