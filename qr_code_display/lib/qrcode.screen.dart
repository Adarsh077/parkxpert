import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter_client_sse/flutter_client_sse.dart';
import 'package:flutter_client_sse/constants/sse_request_type_enum.dart';

// ignore: must_be_immutable
class QrCodeScreen extends StatefulWidget {
  QrCodeScreen(this.ipAddress, {super.key});

  String ipAddress;

  @override
  State<QrCodeScreen> createState() => _QrCodeScreenState();
}

class _QrCodeScreenState extends State<QrCodeScreen> {
  String? qrcode;
  StreamSubscription<SSEModel>? sseStream;

  @override
  void initState() {
    Future.delayed(Duration.zero, listenForSSE);
    super.initState();
  }

  @override
  void dispose() {
    if (sseStream != null) {
      sseStream!.cancel();
    }
    super.dispose();
  }

  void listenForSSE() {
    sseStream = SSEClient.subscribeToSSE(
        method: SSERequestType.GET,
        url: 'http://${widget.ipAddress}/sse/subscribe',
        header: {
          "Accept": "text/event-stream",
          "Cache-Control": "no-cache",
        }).listen(
      (event) {
        handleQrCodeChange(jsonDecode(event.data!)['url']);
      },
    );
  }

  void handleQrCodeChange(qr) {
    setState(() {
      qrcode = qr;
    });
  }

  @override
  Widget build(BuildContext context) {
    print(qrcode);

    return Scaffold(
      body: Center(
          child: qrcode != null
              ? QrImageView(
                  data: qrcode!,
                  version: QrVersions.auto,
                  size: 320,
                  gapless: false,
                )
              : Text('No Data')),
    );
  }
}
