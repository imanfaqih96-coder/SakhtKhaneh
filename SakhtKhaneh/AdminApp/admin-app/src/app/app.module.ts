import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component'; // حتما این فایل وجود داشته باشد و standalone باشد

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    AppComponent, // چون standalone هست، می‌تونی اینجا importش کنی
    HttpClientModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
