import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule   // <--- اینجا
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
