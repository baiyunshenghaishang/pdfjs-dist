# PDF.js

fork 自mozilla/pdfjs-dist  2.2.228
由于修改，提升版本值2.2.229

去掉了build/pdf.work.js line 28998行隐藏签名的部分

修改webpack.js worker-loader使用inline模式，否则 pdfjs.GlobalWorkerOptions.workerPort = new PdfjsWorker()


