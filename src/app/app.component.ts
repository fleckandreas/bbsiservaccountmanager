import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataConnectorService, Workspace } from './data-connector.service';
import { ElectronService } from './core/services/electron/electron.service';
import { AppConfig } from '../environments/environment';
//import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { ipcRenderer } from 'electron';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  workspace: Workspace;
  editname = false;
  constructor(public electronService: ElectronService,
    private translate: TranslateService, private datastore: DataConnectorService) {

    translate.setDefaultLang('de');
    console.log('AppConfig', AppConfig);

    if (electronService.isElectron()) {
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);

    } else {
      console.log('Mode web');
    }
    this.datastore.worspace$.subscribe(workspace => {
      this.workspace = workspace;
    })
  }
  getIservFile() {
    if (this.workspace) {
      const schueler = [];
      this.workspace.schueler.forEach(s => {
        let canExport = true;
        this.workspace.options.notExportPatternKK.split(',').forEach(element => {
          /* console.log(element);
           console.log((s.KL_NAME as String).substr(0,element.length));*/
          if ((s.KL_NAME as String).substr(0, element.length) === element) {
            canExport = false;
          };
        });
        if (canExport) {
          schueler.push(s);
        }
      })
      let csv = this.JSONToCSVConvertor(schueler, this.workspace.options.IServColumns.split(","));

      let blob = new Blob([csv], { type: 'text/csv' });
      var downloadLink = document.createElement("a");

      var url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = "iservSchuelerAccounts.csv";  //Name the file here
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }
  getIservLehrerFile() {
    if (this.workspace) {
      const lehrer = this.workspace.lehrer;//.filter(l => l.Klassen !== '')
      let csv = this.JSONToCSVConvertor(lehrer, ['id', 'NNAME', 'VNAME', 'Kurz', 'Klassen']);

      let blob = new Blob([csv], { type: 'text/csv' });
      var downloadLink = document.createElement("a");

      var url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = "iservLehrerAccounts.csv";  //Name the file here
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }


  JSONToCSVConvertor(JSONData, Header: Array<string>) {

    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    var CSV = '';
    //This condition will generate the Label/Header
    if (Header.length > 0) {
      var row = "";

      //This loop will extract the label from 1st index of on array
      Header.forEach(index => {
        //Now convert each value to string and comma-seprated
        row += index + ';';
      });
      row = row.slice(0, -1);
      //append Label row with line break
      CSV += row + '\r\n';
    }

    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
      var row = "";
      //2nd loop will extract each column and convert it in string comma-seprated
      Header.forEach(index => {
        row += '"' + arrData[i][index] + '";';
      })
      row = row.slice(0, row.length - 1);
      //add a line break after each row
      CSV += row + '\r\n';
    }

    if (CSV == '') {
      alert("Invalid data");
      return;
    }
    return CSV;

  }

  openWorkspace() {
    console.log("open workspace")
    this.electronService.remote.dialog.showOpenDialog({ properties: ['openDirectory'] }).then(dialogResult => {


      if (dialogResult.filePaths.length === 1) {
        this.datastore.readWorkspace(dialogResult.filePaths[0]);
      }
    });


  }
  saveWorkspace() {
    this.datastore.saveWorkspace();
  }
  back() {
    history.back();
  }


  async generateKlassenListen() {
   await this.datastore.clearoutput('csv');
   await this.datastore.clearoutput('xlsx');
   
    const klassen = [];
    const kurse = [];
    
    this.workspace.schueler.forEach(schueler => {
      const klasse = klassen.find(k => k.name === schueler.KL_NAME);
      if (!klasse) {
        klassen.push({ name: schueler.KL_NAME, schueler: [schueler] })
      } else {
        klasse.schueler.push(schueler);
      }

      schueler.Kurse.split(';').forEach(kurs => {
        const kursex = kurse.find(k => k.name === kurs);
        if (!kursex) {
          kurse.push({ name: kurs, schueler: [schueler] })
        } else {
          kursex.schueler.push(schueler);
        }
      });
    });
    klassen.forEach(k => {
      let data: Array<any> = k.schueler.map(s => {
        return {
          Klasse: k.name,
          Nachname: s.NNAME,
          Vorname: s.VNAME,
          Account: s.Account,
          Passwort: s.Passwort
        };
      });
      data = data.sort((a, b) => {
        const stringA: string = a.Nachname + a.Vorname;
        const stringB: string = b.Nachname + b.Vorname;
        return (stringA).localeCompare(stringB, 'de-DE')
      });
      const csv = this.JSONToCSVConvertor(data, ['Klasse', 'Nachname', 'Vorname', 'Account', 'Passwort']);
        this.datastore.export('output/csv/' + k.name + '.csv', csv);
        let workbook = new ExcelJS.Workbook();

        this.datastore.readPattern('/vorlageanwesenheitsliste.xlsx').then(buffer => {
          workbook.xlsx.load(buffer).then(workbook => {
            let worksheet = workbook.getWorksheet("Sheet1");
            let i = 3
            data.forEach(d => {
              let row = worksheet.getRow(i);
              let qty = row.getCell(1);
              qty.value = d.Nachname + ', ' + d.Vorname;
              i++;
            })
            workbook.xlsx.writeBuffer().then(buffer => {
              this.datastore.saveBlob('/output/xlsx/' + k.name + '.xlsx', buffer)
            });
          })
        })

    });
    kurse.forEach(k => {
      const data = k.schueler.map(s => {
        return {
          Kurs: k.name,
          Nachname: s.NNAME,
          Vorname: s.VNAME,
          Account: s.Account,
          Passwort: s.Passwort
        };
      }).sort((a, b) => {
        const stringA: string = a.Nachname + a.Vorname;
        const stringB: string = b.Nachname + b.Vorname;
        return (stringA).localeCompare(stringB, 'de-DE')
      });

      const csv = this.JSONToCSVConvertor(data, ['Kurs', 'Nachname', 'Vorname', 'Account', 'Passwort']);
        this.datastore.export('output/csv/' + k.name + '.csv', csv);

      let workbook = new ExcelJS.Workbook();

      this.datastore.readPattern('/vorlageanwesenheitsliste.xlsx').then(buffer => {
        workbook.xlsx.load(buffer).then(workbook => {
          let worksheet = workbook.getWorksheet("Sheet1");
          let i = 3
          data.forEach(d => {
            let row = worksheet.getRow(i);
            let qty = row.getCell(1);
            qty.value = d.Nachname + ', ' + d.Vorname;
            i++;
          })
          workbook.xlsx.writeBuffer().then(buffer => {
            this.datastore.saveBlob('/output/xlsx/' + k.name + '.xlsx', buffer)
          });
        })
      })
    })
  }


}
