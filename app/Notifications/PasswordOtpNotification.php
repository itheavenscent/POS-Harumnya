<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordOtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $code,
        public int $ttlSeconds = 60,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Kode OTP Ganti Password Harumnya: '.$this->code)
            ->greeting('Halo '.($notifiable->name ?? '').'!')
            ->line('Gunakan kode OTP berikut untuk mengganti password akun Harumnya Anda:')
            ->line('**'.$this->code.'**')
            ->line('Kode ini hanya berlaku selama '.$this->ttlSeconds.' detik.')
            ->line('Jika Anda tidak meminta penggantian password, abaikan email ini dan segera amankan akun Anda.');
    }
}
