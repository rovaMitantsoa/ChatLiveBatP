<?php
    require dirname(__DIR__) . '/vendor/autoload.php';
    require dirname(__DIR__) . '/src/Chat.php';

    //Utilisation de Ratchet   
    use Ratchet\Server\IoServer;
    use Ratchet\Http\HttpServer;
    use Ratchet\WebSocket\WsServer;
    use MyApp\MessageServer;


$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new MessageServer()
        )
    ),
    8081
);

echo "Serveur en marche sur le port 8081...\n";
$server->run();
?>