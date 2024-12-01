import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { Router } from '@angular/router';  

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class RequestsComponent implements OnInit {
  requests: any[] = [];
  selectedProduct: string | null = null;

  constructor(private firebaseSvc: FirebaseService, private utilsSvc: UtilsService,private router: Router) {}

  ngOnInit() {
    const user = this.utilsSvc.getFromLocalStorage('user');
    if (user) {
      this.firebaseSvc.getUserProducts(user.uid).subscribe((products: any) => {
        this.selectedProduct = products[0]?.id || null;
        if (this.selectedProduct) {
          this.fetchRequests(user.uid, this.selectedProduct);
        }
      });
    }
  }

  fetchRequests(uid: string, productId: string) {
    this.firebaseSvc.getReservationRequests(uid, productId).subscribe((requests: any) => {
      console.log('Solicitudes cargadas:', requests);
      this.requests = requests;
    });
  }
  async updateRequestStatus(uid: string, productId: string, requestId: string, action: 'accept' | 'reject') {
    const request = this.requests.find(req => req.id === requestId);
    if (request) {
      if (action === 'accept') {
        
        const product = this.selectedProduct;  // Esto debe ser un objeto con más información
      
        // Asegurarte de que la patente esté disponible
        const patente = product ? product['patente'] : null;
  
        if (patente) {
          request['patente'] = patente;
        }
        await this.firebaseSvc.updateProductSoldUnits(uid, productId, request.reservedSeats);

        await this.firebaseSvc.addToReservados(uid, productId, request);
        
        await this.firebaseSvc.deleteRequest(uid, productId, requestId);  
  
        this.utilsSvc.presentToast({
          message: 'Solicitud aceptada y reservada',
          color: 'success',
          duration: 2000
        });
      } else if (action === 'reject') {
        await this.firebaseSvc.deleteRequest(uid, productId, requestId);  
  
        this.utilsSvc.presentToast({
          message: 'Solicitud rechazada',
          color: 'danger',
          duration: 2000
        });
      }
    }
  }

  goToHome() {
    this.router.navigateByUrl('/main/home'); 
  }
}