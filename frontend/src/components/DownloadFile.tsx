
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';

export default async function DownloadFile(
    fileName: string,
    fileUrl: string,
    onBegin?: (totalBytes: number) => void,
    onProgress?: (bytesWritten: number, contentLength: number) => void
): Promise<boolean> {
    try {
        let filePath = '';

        if (Platform.OS === 'android') {
            // Solicita permissão de armazenamento no Android
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'Permissão de Armazenamento',
                    message: 'O aplicativo precisa de permissão para salvar o manual na pasta de downloads.',
                    buttonPositive: 'Permitir',
                    buttonNegative: 'Cancelar',
                }
            );

            // Se a permissão for concedida ou no Android 10+ (onde a permissão pode retornar negada mas a pasta pública do app funciona), definimos o caminho público
            filePath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
        } else {
            filePath = `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;
        }

        // Remover arquivo anterior se existir
        if (await RNFS.exists(filePath)) {
            await RNFS.unlink(filePath);
        }

        console.log('Tentando baixar arquivo para o diretório de Downloads público:', filePath);

        const downloadOptions = {
            fromUrl: fileUrl,
            toFile: filePath,
            begin: (res: any) => {
                if (onBegin && res.contentLength > 0) {
                    onBegin(res.contentLength);
                }
            },
            progress: (res: any) => {
                if (onProgress && res.contentLength > 0) {
                    onProgress(res.bytesWritten, res.contentLength);
                }
            },
        };

        const downloadResult = await RNFS.downloadFile(downloadOptions).promise;

        if (downloadResult.statusCode === 200) {
            // Adiciona o arquivo ao indexador do Android (MediaScanner) para aparecer no app "Downloads" ou "Arquivos" do celular
            if (Platform.OS === 'android') {
                await RNFS.scanFile(filePath);
            }
            
            Alert.alert('Download concluído', `O manual foi salvo com sucesso em: ${filePath}`);
            return true;
        } else {
            throw new Error(`Erro de status no download: ${downloadResult.statusCode}`);
        }
    } catch (error) {
        console.warn('Falha ao baixar no diretório público. Tentando diretório externo do aplicativo...', error);

        // Se falhar no diretório público devido às restrições de escrita do Android (Scoped Storage),
        // baixamos no diretório de arquivos externos do app, que também é visível no gerenciador de arquivos do celular (Android/data/com.frontend/files)
        try {
            if (Platform.OS === 'android') {
                const fallbackPath = `${RNFS.ExternalDirectoryPath}/${fileName}.pdf`;
                
                if (await RNFS.exists(fallbackPath)) {
                    await RNFS.unlink(fallbackPath);
                }

                console.log('Baixando no fallback externo:', fallbackPath);

                const fallbackOptions = {
                    fromUrl: fileUrl,
                    toFile: fallbackPath,
                    begin: (res: any) => {
                        if (onBegin && res.contentLength > 0) {
                            onBegin(res.contentLength);
                        }
                    },
                    progress: (res: any) => {
                        if (onProgress && res.contentLength > 0) {
                            onProgress(res.bytesWritten, res.contentLength);
                        }
                    },
                };

                const downloadResult = await RNFS.downloadFile(fallbackOptions).promise;

                if (downloadResult.statusCode === 200) {
                    await RNFS.scanFile(fallbackPath);
                    Alert.alert(
                        'Download concluído', 
                        `O manual foi salvo na pasta local do app no seu celular:\n${fallbackPath}`
                    );
                    return true;
                }
            }
        } catch (innerError) {
            console.error('Falha no fallback:', innerError);
        }

        Alert.alert('Erro', 'Não foi possível baixar o arquivo. Verifique sua conexão.');
        return false;
    }
}


