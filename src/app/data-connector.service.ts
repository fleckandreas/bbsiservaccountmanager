import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { MatSnackBar } from '@angular/material';
import { ElectronService } from './core/services/electron/electron.service';
const path = require('path');

const server = 'http://localhost/schuldb/rest';
const url = server + '/data.php/';

export class Workspace {
  name: string = '';
  options: any;
  schueler: Array<any> = [];
  lehrer: Array<any> = [];

}
@Injectable()
export class DataConnectorService {
  constructor(private electron: ElectronService, private snackBar: MatSnackBar) {
    this.folder = localStorage.getItem('lastWorkspace');
    console.log(this.folder);
    if (this.folder && this.folder !== '') {
      this.loadWorkspace(this.folder, false);
    }
  }
  public iservimportfile = server + '/data/iservimport.csv';
  private options = {
    removePattern: ',; der; van; ter; von; de; geb.*;\\(([^)]+)\\)',
    replaceUnderscorePattern: '\\.;\/',
    pwdGen: false,
    BBSImportColumns: 'NNAME,VNAME,GEBDAT,KL_NAME,Kurse',
    IServColumns: 'id,AccountVName,AccountNName,KL_NAME,Kurse',
    notExportPatternKK: ''
  };

  folder;
  durationInSeconds = 4;
  currentWorspace: Workspace;
  worspace$: BehaviorSubject<Workspace> = new BehaviorSubject(new Workspace());
  private loadWorkspace(folder, createNew: boolean = true) {
    const file = folder + '/workspace.json';
    this.electron.fs.readFile(file, 'utf8', (err, data) => {
      if (err && createNew === true) {
        const newWorkspace: Workspace = new Workspace();
        newWorkspace.name = 'Neuer Arbeitsbereich';
        newWorkspace.options = this.options;
        this.currentWorspace = newWorkspace;
        this.worspace$.next(this.currentWorspace);
        if (!this.electron.fs.existsSync(folder + '/db')) {
          this.electron.fs.mkdirSync(folder + '/db');
        }
        if (!this.electron.fs.existsSync(folder + '/output')) {
          this.electron.fs.mkdirSync(folder + '/output');
        }
        this.snackBar.open('Neuer Arbeitsbereich angelegt', null, {
          duration: this.durationInSeconds * 1000,
        });
        return console.log(err);
      }
      this.currentWorspace = JSON.parse(data) as Workspace;

      //
      this.worspace$.next(this.currentWorspace);
    });
  }
  readWorkspace(folder) {
    this.folder = folder;
    localStorage.setItem('lastWorkspace', this.folder);
    this.loadWorkspace(this.folder);
  }
  async clearoutput(folder): Promise<any> {
    const directory = this.folder + '/output/' + folder;
    return new Promise((resolve, reject) => {
      this.electron.fs.readdir(directory, async (err, files) => {
        if (err) throw err;
        const unlinkPromises = files.map(filename =>
          this.electron.fs.unlink(path.join(directory, filename), (err) => {
            if (err) {
              alert(err);
            }
          }));
        Promise.all(unlinkPromises).then(() => {
          resolve(true);
        });
      })
    });
  }
  readPattern(file): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if (this.folder && this.folder !== '') {
        const ffile = this.folder + file;

        this.electron.fs.readFile(ffile, (err, data) => {
          if (err) {
            alert(err);
          } else {
            //  console.log(data);
            resolve(data);
          }
        })
      }
    })
  }
  saveBlob(file, blob) {
    if (this.folder && this.folder !== '') {
      const ffile = this.folder + file;
      this.electron.fs.writeFile(ffile, blob, (err) => {
        if (err) {
          console.log(err);
          this.snackBar.open('Fehler beim Speichern:' + err, null, {
            duration: this.durationInSeconds * 1000,
          });
        } else {
          this.snackBar.open(this.currentWorspace.name + ' gespeichert', null, {
            duration: this.durationInSeconds * 1000,
          });
        }
      });
    }
  }
  saveWorkspace() {
    if (this.folder && this.folder !== '') {
      const file = this.folder + '/workspace.json';
      this.electron.fs.writeFile(file, JSON.stringify(this.currentWorspace), (err) => {
        if (err) {
          console.log(err);
          this.snackBar.open('Fehler beim Speichern:' + err, null, {
            duration: this.durationInSeconds * 1000,
          });
        } else {
          this.snackBar.open(this.currentWorspace.name + ' gespeichert', null, {
            duration: this.durationInSeconds * 1000,
          });
        }
      });
    }
  }
  export(relfile, data) {
    const file = this.folder + '/' + relfile;
    this.electron.fs.writeFile(file, data.toString(), (err) => {
      if (err) {
        console.log(err);
        this.snackBar.open('Fehler beim Speichern:' + err, null, {
          duration: this.durationInSeconds * 1000,
        });
      } else {
        this.snackBar.open(relfile + ' gespeichert', null, {
          duration: this.durationInSeconds * 1000,
        });
      }
    });
  }
  public sendUserMessage(str: string) {
    this.snackBar.open(str);
  }
  /*
    public getData(dataname: string): Promise<any> {
      return this.http.get(server + '/load.php?datadescriptor=' + dataname).toPromise();
    }
    public async storeData(dataname: string, data: any): Promise<any> {
      console.log(data);
      return this.http.post(server + '/store.php?datadescriptor=' + dataname, data).toPromise().then(e => {
        console.log(e);
        return e;
      });
    }
    */

  /*public async importBbs(bbsdata, reorg: boolean): Promise<any> {
    const c = {
      reorg: reorg,
      data: bbsdata
    };
    return this.http.post(url + 'importbbs', c).toPromise().then((data) => {
      // console.log(data.json());
      return data; // .json();
    }).catch(e => {
      console.log(e);
    });
  }
  public async importIServ(data): Promise<any> {
    console.log('start');
    return this.http.post(url + 'importiservaccounts', data).toPromise().then((data: Response) => {
      console.log(data);
      // console.log(data.json());
      return data; // .json();
    }).catch(e => {
      console.log(e);
    });
  }
  public applyImportBbs(): Promise<any> {
    return this.http.get(url + 'applyimportbbs').toPromise().then((data: Response) => {
      console.log(data);
      // console.log(data.json());
      return data; // .json();
    });
  }*/
  /*
  public generateKlassenListen(): Promise<any> {
    console.log('generatelists');
    return this.http.get(url + 'generatelists').toPromise().then((data: Response) => {
      console.log(data);
      this.sendUserMessage('Listen generiert');
      return data;
    });
  }
  */
  /*
  public getSchueler(): Promise<any> {
    return this.http.get(url + 'schueler').toPromise().then((data: Response) => {
      return data;
    });
  }*/


  public getAccountNNAME(user: any): string {
    let name = user.NNAME;
    this.options.removePattern.split(';').forEach(s => {
      const reg = new RegExp(s, 'gim');
      name = name.replace(reg, '').trim();
    });

    this.options.replaceUnderscorePattern.split(';').forEach(s => {
      const reg2 = new RegExp(s, 'gim');

      name = name.replace(reg2, '_').trim();
    });

    name = name.replace(new RegExp('[ ]{2,}', 'gim'), ' ');
    return name;
  }
  public getAccountVNAME(user: any): string {
    let name = user.VNAME;
    this.options.removePattern.split(';').forEach(s => {
      const reg = new RegExp(s, 'gim');
      name = name.replace(reg, '').trim();
    });
    this.options.replaceUnderscorePattern.split(';').forEach(s => {
      const reg2 = new RegExp(s, 'gim');

      name = name.replace(reg2, '_').trim();
    });
    name = name.replace(new RegExp('[ ]{2,}', 'gim'), ' ');
    return name;
  }
  public getPasswort(e: any) {
    if (e.Passwort && e.Passwort !== '') {
      return e.Passwort;
    }
    if (e.Passwort && e.Passwort === '' && this.options.pwdGen) {
      const Arr: Array<any> = e.GEBDAT.split('.');
      return Arr.reverse().join('.');
    }
    return '';
  }
  public getKurse(e: any) {
    if (e.Kurse && e.Kurse !== '') {
      return e.Kurse.replace('/', '_');
    }
    return '';
  }
}
