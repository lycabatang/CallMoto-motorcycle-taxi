import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

interface Message {
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
  unread?: boolean;
}

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MessagesPage implements OnInit {
  messages: Message[] = [
    {
      sender: 'John Doe',
      avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
      text: 'Hey, is the motorcycle still available?',
      timestamp: '10:30 AM',
      unread: true
    },
    {
      sender: 'Jane Smith',
      avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
      text: 'I would like to schedule a test ride',
      timestamp: 'Yesterday',
      unread: true
    },
    {
      sender: 'Mike Johnson',
      avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
      text: 'Thanks for the great service!',
      timestamp: '2 days ago'
    }
  ];

  constructor() { }

  ngOnInit() {
    // Initialize messages data
  }

}
