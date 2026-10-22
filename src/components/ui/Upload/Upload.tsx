import { useRef, useState, useCallback, useEffect } from 'react'
import classNames from '../utils/classNames'
import cloneDeep from 'lodash/cloneDeep'
import FileItem from './FileItem'
import Button from '../Button/Button'
import CloseButton from '../CloseButton'
import Notification from '../Notification/Notification'
import toast from '../toast/toast'
import type { CommonProps } from '../@types/common'
import type { ReactNode, ChangeEvent, MouseEvent, DragEvent, Ref } from 'react'

export interface UploadProps extends CommonProps {
    accept?: string
    beforeUpload?: (file: FileList | null, fileList: File[]) => boolean | string
    disabled?: boolean
    draggable?: boolean
    fileList?: File[]
    fileListClass?: string
    fileItemClass?: string
    multiple?: boolean
    onChange?: (file: File[], fileList: File[]) => void
    onFileRemove?: (file: File[]) => void
    ref?: Ref<HTMLDivElement>
    showList?: boolean
    tip?: string | ReactNode
    uploadLimit?: number
}

const filesToArray = (files: File[]) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.keys(files).map((key) => files[key as any])

const Upload = (props: UploadProps) => {
    const {
        accept,
        beforeUpload,
        disabled = false,
        draggable = false,
        fileList,
        fileListClass,
        fileItemClass,
        multiple,
        onChange,
        onFileRemove,
        ref,
        showList = true,
        tip,
        uploadLimit,
        children,
        className,
        ...rest
    } = props

    const fileInputField = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<File[]>(fileList || [])
    const [dragOver, setDragOver] = useState(false)

    useEffect(() => {
        if (fileList !== undefined) {
            setFiles(fileList)
        }
    }, [fileList])

    const triggerMessage = (msg: string | ReactNode = '') => {
        toast.push(
            <Notification type="danger" duration={2000}>
                {msg || 'Upload Failed!'}
            </Notification>,
            {
                placement: 'top-center',
            },
        )
    }

    const pushFile = (newFiles: FileList | null, file: File[]) => {
        if (newFiles) {
            for (const f of newFiles) {
                file.push(f)
            }
        }

        return file
    }

    const addNewFiles = (newFiles: FileList | null) => {
        let file = cloneDeep(files)
        if (typeof uploadLimit === 'number' && uploadLimit !== 0) {
            if (Object.keys(file).length >= uploadLimit) {
                if (uploadLimit === 1) {
                    file.shift()
                    file = pushFile(newFiles, file)
                }

                return filesToArray({ ...file })
            }
        }
        file = pushFile(newFiles, file)
        return filesToArray({ ...file })
    }

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles || newFiles.length === 0) return
        let result: boolean | string = true

        if (beforeUpload) {
            result = beforeUpload(newFiles, files)

            if (result === false) {
                triggerMessage()
                return
            }

            if (typeof result === 'string' && result.length > 0) {
                triggerMessage(result)
                return
            }
        }

        if (result) {
            const updatedFiles = addNewFiles(newFiles)
            setFiles(updatedFiles)
            onChange?.(updatedFiles, files)
        }
    }

    const onNewFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files)
    }

    const removeFile = (fileIndex: number) => {
        const deletedFileList = files.filter((_, index) => index !== fileIndex)
        setFiles(deletedFileList)
        onFileRemove?.(deletedFileList)
        onChange?.(deletedFileList, files)
    }

    const triggerUpload = (e: MouseEvent<HTMLDivElement>) => {
        if (!disabled) {
            fileInputField.current?.click()
        }
        e.stopPropagation()
    }

    const renderChildren = () => {
        if (!draggable && !children) {
            return (
                <Button disabled={disabled} onClick={(e) => e.preventDefault()}>
                    Upload
                </Button>
            )
        }

        if (draggable && !children) {
            return <span>Choose a file or drag and drop here</span>
        }

        return children
    }

    const handleDragLeave = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            if (draggable) {
                setDragOver(false)
            }
        },
        [draggable],
    )

    const handleDragOver = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            if (draggable && !disabled) {
                setDragOver(true)
            }
        },
        [draggable, disabled],
    )

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            if (draggable) {
                setDragOver(false)
            }
            if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files)
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [draggable, disabled, files, beforeUpload, uploadLimit, onChange],
    )

    const draggableProp = draggable
        ? {
              onDragLeave: handleDragLeave,
              onDragOver: handleDragOver,
              onDrop: handleDrop,
          }
        : {}

    const draggableEventFeedbackClass = `border-primary`

    const uploadClass = classNames(
        'upload',
        draggable && `upload-draggable`,
        draggable && !disabled && `hover:${draggableEventFeedbackClass}`,
        draggable && disabled && 'disabled',
        dragOver && draggableEventFeedbackClass,
        className,
    )

    const uploadInputClass = classNames(
        'upload-input',
        draggable && `draggable`,
    )

    return (
        <>
            <div
                ref={ref}
                className={uploadClass}
                onClick={triggerUpload}
                {...draggableProp}
                {...rest}
            >
                <input
                    ref={fileInputField}
                    className={uploadInputClass}
                    type="file"
                    disabled={disabled}
                    multiple={multiple}
                    accept={accept}
                    title=""
                    value=""
                    onChange={onNewFileUpload}
                    onClick={(e) => e.stopPropagation()}
                ></input>
                {renderChildren()}
            </div>
            {tip}
            {showList && (
                <div className={classNames('upload-file-list', fileListClass)}>
                    {files.map((file, index) => (
                        <FileItem
                            key={file.name + index}
                            file={file}
                            className={fileItemClass}
                        >
                            <CloseButton
                                className="upload-file-remove"
                                onClick={() => removeFile(index)}
                            />
                        </FileItem>
                    ))}
                </div>
            )}
        </>
    )
}

export default Upload
