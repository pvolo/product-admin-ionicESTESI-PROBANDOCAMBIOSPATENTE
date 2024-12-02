import { Component, inject, OnInit } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy,where } from 'firebase/firestore';
import { Router } from '@angular/router';
import { VerReservadosComponent } from 'src/app/shared/components/verreservados/verreservados.component';
import { ModalController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  fireBaseSvs = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  router = inject(Router);

  products:Product[] = [];
  loading:boolean=false;



  constructor(
    private modalCtrl: ModalController,
    private auth: AngularFireAuth 
  ) {}
  ngOnInit() {
  }

  user():User{
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getProducts();
  }

doRefresh(event) {  
  setTimeout(() => {
  this.getProducts();
  event.target.complete();
  }, 1000);
}

  //====Obtener las Ganancias
getProfits(){
return this.products.reduce((index,product)=>index + product.price * product.soldUnits, 0)
}

  //====Obtener los Productos
  getProducts() {
    this.loading = true;

    // Verifica si hay conexión a internet
    Network.getStatus().then((status) => {
        if (status.connected) {
            // Si está conectado a internet, obtiene los productos desde Firebase
            const path = `users/${this.user().uid}/products`;
            const query = [orderBy('soldUnits', 'desc')];
    
            const sub = this.fireBaseSvs.getCollectionData(path, query).subscribe({
                next: (res: any) => {
                    this.products = res;
                    localStorage.setItem('products', JSON.stringify(res));  // Guarda los productos en LocalStorage
                    this.loading = false;
                    sub.unsubscribe();
                },
                error: (err) => {
                    this.loading = false;
                    console.error('Error al obtener los productos de Firebase', err);
                }
            });
        } else {
            // Si no hay conexión, intenta cargar los productos desde LocalStorage
            const storedProducts = localStorage.getItem('products');
            if (storedProducts) {
                this.products = JSON.parse(storedProducts);
            }
            this.loading = false;
        }
    });
}
  //====Agregar o Actualizar Producto
  async addUpdateProduct(product?: Product){

  let success = await  this.utilsSvc.presentModal({
      component:AddUpdateProductComponent,
      cssClass:'add-update-modal',
      componentProps:{ product }
    })

    if(success)this.getProducts();
  }

//====Confirmar Eliminacion del Producto

async confirmDeleteProduct(product:Product) {
  this.utilsSvc.presentAlert({
    header: 'Eliminar!',
    message: '¿Quieres Cancelar El Viaje?',
    mode:'ios',
    buttons: [
      {
        text: 'Cancelar',
      }, {
        text: 'Si, Eliminar',
        handler: () => {
          this.deleteProduct(product)
        }
      }
    ]
  });
}

  //====Eliminar Producto

  async deleteProduct(product:Product) {
    let path = `users/${this.user().uid}/products/${product.id}`
    const loading = await this.utilsSvc.loading();
    await loading.present();
    let imagePath=await this.fireBaseSvs.getFilePath(product.image);
    await this.fireBaseSvs.deleteFile(imagePath);
    this.fireBaseSvs.deleteDocument(path).then(async res => {
      this.products=this.products.filter(p=>p.id!=product.id)
      this.utilsSvc.presentToast({
        message:'Viaje Eliminado Exitosamente',
        duration: 2000,
        color:'success',
        position:'middle',
        icon:'checkmark-circle-outline'
      })
    }).catch(error =>{
      console.log(error);
      this.utilsSvc.presentToast({
        message: error.message,
        duration: 2500,
        color:'primary',
        position:'middle',
        icon:'alert-circle-outline'
      })
    }).finally(()=>{
      loading.dismiss();
    })
  }

  async openVerReservados() {
    const user = await this.auth.currentUser;
    if (user) {
      const conductorUid = user.uid;

    
      const modal = await this.modalCtrl.create({
        component: VerReservadosComponent,
        componentProps: {
          productCreatorUid: conductorUid 
        }
      });
      await modal.present();
    } else {
      console.error('No se pudo obtener el UID del conductor');
    }
  }

}
