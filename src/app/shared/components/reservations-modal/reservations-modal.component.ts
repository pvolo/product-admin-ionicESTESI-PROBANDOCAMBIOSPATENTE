import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';
import { ChatComponent } from '../chat/chat.component';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-reservations-modal',
  templateUrl: './reservations-modal.component.html',
  styleUrls: ['./reservations-modal.component.scss'],
})
export class ReservationsModalComponent implements OnInit {
  reservados: any[] = [];
  @Input() userUid: string = '';

  constructor(
    private modalCtrl: ModalController,
    private firebaseSvc: FirebaseService
  ) {}

  async ngOnInit() {
    const status = await Network.getStatus();
  
    if (status.connected) {
      // Si hay conexión, obtener las reservas desde Firestore
      if (this.userUid) {
        this.firebaseSvc.getUserReservations(this.userUid).then(
          (reservados) => {
            this.reservados = reservados;
            localStorage.setItem(`reservas_${this.userUid}`, JSON.stringify(reservados));
          }
        ).catch((error) => {
          console.error('Error al obtener las reservaciones:', error);
        });
      } else {
        console.error('No se pudo obtener el UID del usuario');
      } 
      
    } else {
      // Si no hay conexión, cargar las reservas del localStorage
      const storedReservas = localStorage.getItem(`reservas_${this.userUid}`);
      if (storedReservas) {
        this.reservados = JSON.parse(storedReservas);
      } else {
        console.log('No hay reservas almacenadas localmente.');
      }
    }
  }

  close() {
    this.modalCtrl.dismiss();
  }

  openChat(reservation: any) {
    this.modalCtrl
      .create({
        component: ChatComponent,
        componentProps: {
          userUid: reservation.userUid,
          productCreatorUid: reservation.productCreatorUid,
          productCreatorName: reservation.productCreatorName,
          isSenderUser: true,
        },
      })
      .then((modal) => modal.present());
  }
}
