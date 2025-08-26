
import { Alert } from 'react-native';
import RNFS from 'react-native-fs';

export default async function DownloadFile(fileUrl: string) {
    const filePath = `${RNFS.DownloadDirectoryPath}/termo-de-uso-tradutor.pdf`;

    try {
        const downloadResult = await RNFS.downloadFile({
            fromUrl: fileUrl,
            toFile: filePath,
        }).promise;

        if (downloadResult.statusCode === 200) {
            console.log('Download concluído:', filePath);
            Alert.alert('Download concluído', 'O arquivo foi salvo com sucesso!');
        } else {
            console.warn('Falha no download. Código:', downloadResult.statusCode);
            Alert.alert('Erro', 'Não foi possível baixar o arquivo.');
        }
    } catch (error) {
        console.warn('Erro ao baixar o PDF:', error);
        Alert.alert('Erro', 'Ocorreu um problema ao baixar o arquivo.');
    }
};