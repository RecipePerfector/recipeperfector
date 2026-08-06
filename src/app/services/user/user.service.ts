import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Router } from '@angular/router';

@Injectable({providedIn: 'root'})


export class UserService {
  private teamService: { setSelectedTeam: (team: any) => void } | null = null;

  loggedIn: boolean = false;
  userTeams: any[] = [];
  userImageURL: string = '';
  tableHeadersAdd: Array<any> = [
    {value: 'select', title: ''},
    {value: 'name', title: 'Name'},
    {value: 'ptn', title: 'Position(s)-Team-#'},
    {value: 'designation', title: 'Designation'}
  ];
  tableHeadersDrop: Array<any> = [
    {value: 'select', title: ''},
    {value: 'ffPosition', title: 'Slot'},
    {value: 'name', title: 'Name'},
    {value: 'ptn', title: 'Position(s)-Team-#'},
    {value: 'designation', title: 'Designation'}
  ];
  tableHeadersTransaction: Array<any> = [
    {value: 'name', title: 'Name'},
    {value: 'ptn', title: 'Position(s)-Team-#'},
    {value: 'designation', title: 'Designation'}
  ];
  tableHeadersTransactionScreen: Array<any> = [
    {value: 'add_player_name', title: 'Add Name'},
    {value: 'drop_player_name', title: 'Drop Name'},
    {value: 'time_to_run', title: 'Time Set To Run'},
    {value: 'transaction_status', title: 'Status'},
    //{value: 'time_to_run', title: 'Designation'}
  ];
  tableHeadersTransactionDelete: Array<any> = [
    {value: 'add_player_name', title: 'Add Name'},
    {value: 'drop_player_name', title: 'Drop Name'},
    {value: 'time_to_run', title: 'Time Set To Run'}
  ];

  tableHeadersTransactionConvert: Array<any> = [
    {value: 'add_player_name', title: 'Add Name'},
    {value: 'drop_player_name', title: 'Drop Name'},
    {value: 'waiver_date', title: 'Waiver Date'}
  ]

  tableHeadersConvertScreen: Array<any> = [
    {value: 'fullName', title: 'Name'},
    {value: 'ptn', title: 'Position(s)-Team'}, 
    {value: 'waiver_date', title: 'Waiver Date'}
  ];

  constructor(private api: ApiService, private router: Router) { }

  isUserLoggedIn(): boolean {
    return this.loggedIn;
  }

  setUserLoggedIn(isLoggedIn: boolean): void {
    this.loggedIn = isLoggedIn;
  }

  async createNewUser(email: string, password: string): Promise<any>{
    const response = await this.api.callAPIPost('/api/users/register', { email: email, password: password });
    console.log('createNewUser response: ');
    console.log(response);
    return response;
  }

  confirmUserEmail(email: string, code: string): Promise<any> {
    console.log('Code being sent: ', code);
    const response = this.api.callAPIPost('/api/users/confirm-email', { email: email, code: code });
    console.log('confirm response: ');
    console.log(response);
    return response;
  }

  getUserTeams(): any[] {
    return this.userTeams;
  }

  setUserTeams(userTeams: any[]): void {
    this.userTeams = userTeams;
  }

  getTableHeadersAdd(): Array<any> {
    return this.tableHeadersAdd;
  }

  setTableHeadersAdd(tableHeadersAdd: any): void {
    this.tableHeadersAdd = tableHeadersAdd;
  }

  getTableHeadersDrop(): Array<any> {
    return this.tableHeadersDrop;
  }

  setTableHeadersDrop(tableHeadersDrop: any): void {
    this.tableHeadersDrop = tableHeadersDrop;
  }

  getTableHeadersTransaction(): Array<any> {
    return this.tableHeadersTransaction;
  }

  setTableHeadersTransaction(tableHeadersTransaction: any): void {
    this.tableHeadersTransaction = tableHeadersTransaction;
  }

  getTableHeadersTransactionScreen(): Array<any> {
    return this.tableHeadersTransactionScreen;
  }

  getTableHeadersTransactionDelete(): Array<any> {
    return this.tableHeadersTransactionDelete;
  }

  getTableHeadersTransactionConvert(): Array<any> {
    return this.tableHeadersTransactionConvert;
  }

  setTableHeadersTransactionScreen(tableHeadersTransactionScreen: any): void {
    this.tableHeadersTransactionScreen = tableHeadersTransactionScreen;
  }

  getTableHeadersConvertScreen(): Array<any> {
    return this.tableHeadersConvertScreen;
  }

  redirectYahooLogin(): void {
    /*this.api.callAPIGet('/signin').then((data: any) => {
      if(data['url']) {
        window.location.href = data['url'];
      }
    });*/
  }

  submitUserCode(code: string): void {
    /*this.api.callAPIGet('/getuser', {'code': code}).then((data: any) => {
      this.userImageURL = data.user_image_url;
      this.setUserLoggedIn(true);

      this.setupScreenForUser(data);

      this.router.navigate(['/convert']);
    });*/
  }

  async validSession(): Promise<boolean> {
    //TODO: Probably need to refresh screen in validSession
    //Pass what screen the user is on and process the data properly
    /*const sessionData: any = await this.api.callAPIGet('/checkSession'); 
    if(sessionData && sessionData.is_valid){
      this.userImageURL = sessionData.user_image_url;
      this.setupScreenForUser(sessionData);
      this.setUserLoggedIn(true);
      return true;
    } else {
      this.setUserLoggedIn(false);
      return false;
    }*/
   return false;
  }

  setupScreenForUser(data: any): void {
    this.userTeams = this.convertUserTeamsToDropDown(data.user_teams);
    if(data.default_team) {
      this.setSelectedTeam(data.default_team);
    } else {
      if(this.userTeams && this.userTeams.length > 0) {
        this.setSelectedTeam(this.userTeams[0]);
      }
    }
  }

  private setSelectedTeam(team: any): void {
    if (this.teamService) {
      this.teamService.setSelectedTeam(team);
    }
  }
  
  getUserImageURL(): string {
    return this.userImageURL;
  }

  convertUserTeamsToDropDown(data: any): any[] {
    let sportsGroups: any[] = [];
    

    if(data) {
      for(const gameProperty  of Object.keys(data))  {
        if (gameProperty == 'count') continue;

        const game = data[gameProperty]['game'];
        const gameGroup: any = {}
        gameGroup['name'] = game[0]['name'];
        gameGroup['teams'] = [];
        gameGroup['image'] = './assets/images/soccer.png';

        for(const teamJSON of Object.keys(game[1]['teams'])){
          if (teamJSON == 'count') continue;
          const team = game[1]['teams'][teamJSON]['team'][0];
          const convertedteam = team;
          const teamEntry: any = {};
          const teamKey = convertedteam['team_key']
          teamEntry['value'] = teamKey
          const leagueID = teamKey.split('.')[2];
          teamEntry['viewValue'] = convertedteam['name'] + ' - League ID: ' + leagueID;
          teamEntry['name'] = convertedteam['name'];
          gameGroup['teams'].push(teamEntry);
        }
        sportsGroups.push(gameGroup);
      }
    }

    return sportsGroups;
  }
}
